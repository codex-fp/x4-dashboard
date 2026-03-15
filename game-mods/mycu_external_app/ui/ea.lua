local ffi = require("ffi")
local C = ffi.C

local widgets

local mapMenu

local external = {
    maxGroup = 3, -- Maximum number of groups.
    cycleCounter = 0, -- Counter for cycle through groups.
    lastChecksums = {}, -- Store checksums of last sent results for change detection
    debugMessages = 0,
    debugLimit = 40,
};

local request = require("djfhe.http.request")
local httpClient = require("djfhe.http.client")
local method = 'POST'
local apiUrl = "http://" .. host .. ":" .. port .. "/api/data"

local function breadcrumb(message, always)
    if always or external.debugMessages < external.debugLimit then
        external.debugMessages = external.debugMessages + 1
        DebugError("ExternalApp: " .. tostring(message))
    end
end

local function pumpHttpClient(reason)
    local ok, err = pcall(httpClient.update)
    if not ok then
        DebugError("ExternalApp: http client update failed" .. (reason and (" during " .. tostring(reason)) or "") .. ": " .. tostring(err))
    end
end



local function init ()
    breadcrumb("init start host=" .. tostring(host) .. " port=" .. tostring(port), true)
    package.path = package.path .. ";extensions/mycu_external_app/ui/?.lua";
    widgets = require("widgets")
    breadcrumb("widgets loaded", true)

    mapMenu = Helper.getMenu("MapMenu")
    breadcrumb("map menu=" .. tostring(mapMenu ~= nil), true)

    -- Main event
    RegisterEvent("externalapp.getMessages", external.send)
    breadcrumb("registered event externalapp.getMessages", true)

    -- Reputations and Professions mod event triggered after all available guild missions offers are created AFTER the player clicks on the "Connect to the Guild Network" button
    RegisterEvent("kProfs.guildNetwork_onLoaded", external.send)
    breadcrumb("registered event kProfs.guildNetwork_onLoaded", true)
end

---
--- Send data to external app server
---
function external.send (_, param)
    pumpHttpClient("pre-send")

    local payload = external.fetchData()
    if external.cycleCounter <= 6 then
        local payloadKeys = {}
        for key in pairs(payload) do
            table.insert(payloadKeys, tostring(key))
        end
        table.sort(payloadKeys)
        breadcrumb("send cycle=" .. tostring(external.cycleCounter) .. " keys=" .. table.concat(payloadKeys, ","))
    end

    local response, requestErr = request.new(method)
           :setUrl(apiUrl)
           :setBody(payload)
           :send(
             function(response, err)
                 if err then
                     DebugError("Error occured while sending data to External App Server: " .. tostring(err))
                 elseif external.cycleCounter <= 6 then
                     breadcrumb("http send ok cycle=" .. tostring(external.cycleCounter))
                 end
              end
    )

    if not response and requestErr then
        DebugError("ExternalApp: request send failed: " .. tostring(requestErr))
    elseif external.cycleCounter <= 6 then
        breadcrumb("request queued cycle=" .. tostring(external.cycleCounter))
    end

    pumpHttpClient("post-send")
end

---
--- Fetch data from widgets
---
function external.fetchData()
    local payload = {
        time = C.GetCurrentGameTime()
    }
    external.cycleCounter = external.cycleCounter + 1

    -- Determine which group to process (1,2,3 and then repeat)
    local widgetGroupToProcess = external.cycleCounter % external.maxGroup + 1
    if external.cycleCounter <= 6 then
        breadcrumb("fetch start cycle=" .. tostring(external.cycleCounter) .. " group=" .. tostring(widgetGroupToProcess))
    end

    for key, widget in pairs(widgets) do
        for _, group in ipairs(widget.groups) do
            -- Process only the widgets that belong to the current group
            if group == widgetGroupToProcess then
                if external.cycleCounter <= 6 then
                    breadcrumb("running widget=" .. tostring(key) .. " path=" .. tostring(widget.path))
                end
                local okRequire, output = pcall(require, widget.path)
                if not okRequire then
                    DebugError("Error loading widget '" .. tostring(key) .. "': " .. tostring(output))
                elseif type(output) ~= "table" or type(output.handle) ~= "function" then
                    DebugError("Widget '" .. tostring(key) .. "' does not export handle()")
                else
                    local okHandle, result = pcall(output.handle)
                    if not okHandle then
                        DebugError("Error in widget '" .. tostring(key) .. "': " .. tostring(result))
                    elseif result ~= nil then
                        if external.cycleCounter <= 6 then
                            breadcrumb("widget ok=" .. tostring(key))
                        end
                        local exclusions = output.hashExclusions or {}
                        -- Check if result has changed since last time
                        if external.hasResultChanged(key, result, exclusions) then
                            payload[key] = result
                            -- Update stored checksum
                            external.lastChecksums[key] = external.generateChecksum(result, exclusions)
                        end
                    end
                end
                break
            end
        end
    end

    return external.removeUnsupportedTypes(payload)
end

---
--- Remove unsupported types
---
function external.removeUnsupportedTypes(value)
    local elementType = type(value)

    if elementType == "cname" or elementType == "userdata" or elementType == "cdata" then
        value = nil
    end

    if elementType == "table" then
        for k, v in pairs(value) do
            value[k] = external.removeUnsupportedTypes(v)
        end
    end

    return value
end

---
--- Check if result has changed since last time
---
function external.hasResultChanged(key, newResult, exclusions)
    local lastChecksum = external.lastChecksums[key]

    -- If no previous checksum exists, consider it changed
    if lastChecksum == nil then
        return true
    end

    -- Compare checksums with exclusions
    exclusions = exclusions or {}
    local newChecksum = external.generateChecksum(newResult, exclusions)
    return lastChecksum ~= newChecksum
end

---
--- Generate a simple checksum for any value
---
function external.generateChecksum(value, exclusions)
    exclusions = exclusions or {}
    return external.hashValue(value, 0, exclusions)
end

---
--- Hash a value recursively with exclusions support
---
function external.hashValue(value, hash, exclusions)
    local valueType = type(value)
    exclusions = exclusions or {}

    if valueType == "nil" then
        return external.hashString("nil", hash)
    elseif valueType == "boolean" then
        return external.hashString(tostring(value), hash)
    elseif valueType == "number" then
        return external.hashString(tostring(value), hash)
    elseif valueType == "string" then
        return external.hashString(value, hash)
    elseif valueType == "table" then
        -- Sort keys for consistent hashing
        local keys = {}
        for k in pairs(value) do
            table.insert(keys, k)
        end
        table.sort(keys, function(a, b)
            return tostring(a) < tostring(b)
        end)

        -- Hash each key-value pair, excluding specified properties
        for _, k in ipairs(keys) do
            if not external.isExcluded(k, exclusions) then
                hash = external.hashValue(k, hash, exclusions)
                hash = external.hashValue(value[k], hash, exclusions)
            end
        end
        return hash
    else
        -- For other types, just hash the type name
        return external.hashString(valueType, hash)
    end
end

---
--- Check if a property should be excluded from hashing
---
function external.isExcluded(property, exclusions)
    for _, excluded in ipairs(exclusions) do
        if property == excluded then
            return true
        end
    end
    return false
end

---
--- Simple string hashing function (djb2 algorithm)
---
function external.hashString(str, hash)
    hash = hash or 5381 -- djb2 initial value

    for i = 1, #str do
        local byte = string.byte(str, i)
        hash = ((hash * 33) + byte) % 4294967296
    end

    return hash
end

init()
