local output = {}

function output.handle()
    local mapMenu = Helper.getMenu("MapMenu")
    local missionBriefingMenu = Helper.getMenu("MissionBriefingMenu")
    local numMissions = GetNumMissions()

    for i = 1, numMissions do
        local entry = mapMenu.getMissionInfoHelper(i)

        if entry.active then
            local details = missionBriefingMenu.getMissionIDInfoHelper(ConvertIDTo64Bit(entry.ID))

            return {
                name        = details.name or entry.name or "",
                description = details.description or "",
                completed   = details.completed or false,
                reward      = entry.reward or 0,
                timeleft    = math.max(0, entry.timeleft or 0),
            }
        end
    end

    -- No active mission — return empty sentinel so merge clears the previous value
    return { name = "", completed = false, reward = 0, timeleft = 0 }
end

return output
