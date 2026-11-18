-- Path of Building for Humans: calculation bridge.
--
-- Runs Path of Building Community (MIT licence) headless and turns a character
-- or a PoB build into the JSON the dashboard and the guide need.
--
-- Usage (working directory must be PoB's `src` folder):
--   luajit pobh_engine.lua <request.json>
--
-- Request shapes:
--   { "kind": "character", "character": { name, league, class, level, equipment, passives, jewels, ... } }
--   { "kind": "build", "xml": "<PathOfBuilding>...</PathOfBuilding>" }
--   { "kind": "compare", "character": { ... }, "xml": "<PathOfBuilding>...</PathOfBuilding>" }
--
-- The result is printed on one line after the marker "@@POBH_RESULT@@",
-- because PoB writes its own log lines to stdout while it loads.

local requestPath = arg and arg[1]
assert(requestPath, "usage: pobh_engine.lua <request.json>")

dofile("HeadlessWrapper.lua")

local dkjson = require("dkjson")

local function readFile(path)
	local f = assert(io.open(path, "rb"))
	local text = f:read("*a")
	f:close()
	return text
end

local request = assert(dkjson.decode(readFile(requestPath)), "request is not valid JSON")

local STAT_KEYS = {
	"Life", "LifeUnreserved", "EnergyShield", "Mana", "ManaUnreserved", "Ward",
	"FireResist", "ColdResist", "LightningResist", "ChaosResist",
	"FireResistOverCap", "ColdResistOverCap", "LightningResistOverCap", "ChaosResistOverCap",
	"TotalEHP", "PhysicalMaximumHitTaken", "FireMaximumHitTaken", "ColdMaximumHitTaken",
	"LightningMaximumHitTaken", "ChaosMaximumHitTaken",
	"Armour", "Evasion", "BlockChance", "SpellBlockChance", "SpellSuppressionChance",
	"MeleeEvadeChance", "ProjectileEvadeChance",
	"FullDPS", "CombinedDPS", "TotalDPS", "TotalDot", "AverageHit", "Speed",
	"HitChance", "CritChance", "CritMultiplier",
	"EffectiveMovementSpeedMod", "LifeRegenRecovery", "LifeLeechGainRate",
}

local function recalc()
	build.buildFlag = true
	runCallback("OnFrame")
	return build.calcsTab.mainOutput or {}
end

local function finite(value)
	return type(value) == "number" and value == value and value ~= math.huge and value ~= -math.huge
end

local function dps(out)
	if finite(out.FullDPS) and out.FullDPS > 0 then return out.FullDPS end
	if finite(out.CombinedDPS) then return out.CombinedDPS end
	if finite(out.TotalDPS) then return out.TotalDPS end
	return 0
end

local function ehp(out)
	return finite(out.TotalEHP) and out.TotalEHP or 0
end

-- Pick the socket group with the highest DPS, which is almost always the
-- skill the player is actually using.
local function pickMainSkill()
	local groups = build.skillsTab.socketGroupList or {}
	local best, bestDps = build.mainSocketGroup or 1, -1
	for index, group in ipairs(groups) do
		if group.enabled ~= false then
			build.mainSocketGroup = index
			local value = dps(recalc())
			if value > bestDps then
				best, bestDps = index, value
			end
		end
	end
	build.mainSocketGroup = best
	recalc()
end

local function loadCharacter(character)
	newBuild()
	build.importTab:ImportItemsAndSkills(character, true, true, false)
	build.importTab:ImportPassiveTreeAndJewels(character, true)
	runCallback("OnFrame")
	pickMainSkill()
end

-- Guide stages. Guides such as Maxroll's store each stage as a passive tree
-- whose title ends in "{n}", and tag item sets and skill sets with the stage
-- numbers they belong to, e.g. "Early Campaign {1,2,3,4}".
local function stageNumbers(title)
	local numbers = {}
	local inside = (title or ""):match("{([%d,%s]+)}")
	for n in (inside or ""):gmatch("%d+") do
		numbers[tonumber(n)] = true
	end
	return numbers
end

-- Path of Building colour codes ("^7", "^xFF8800") are for its own UI; the app shows plain text.
local function plainText(text)
	if type(text) ~= "string" then return text end
	return (text:gsub("%^x%x%x%x%x%x%x", ""):gsub("%^%d", ""))
end

local function cleanTitle(title)
	return (plainText(title or ""):gsub("%s*{[%d,%s]*}%s*$", ""))
end

local function matchingSetId(orderList, sets, wanted)
	for _, id in ipairs(orderList or {}) do
		local set = sets[id]
		for n in pairs(stageNumbers(set and set.title)) do
			if wanted[n] then
				return id
			end
		end
	end
end

local function listStages()
	local stages = {}
	for index, spec in ipairs(build.treeTab.specList or {}) do
		local title = cleanTitle(spec.title)
		local low, high = title:match("^(%d+)%s*%-%s*(%d+)")
		stages[#stages + 1] = {
			index = index,
			title = title ~= "" and title or ("Stage " .. index),
			minLevel = tonumber(low),
			maxLevel = tonumber(high),
		}
	end
	return stages
end

-- Default stage for a character level: the levelling range that contains it,
-- or the first non-levelling stage once the character is past every range.
local function stageForLevel(stages, level)
	if not level then return nil end
	local highest = 0
	for _, stage in ipairs(stages) do
		if stage.minLevel and level >= stage.minLevel and level <= stage.maxLevel then
			return stage.index
		end
		highest = math.max(highest, stage.maxLevel or 0)
	end
	-- Only for guides that do give level ranges; otherwise any level would land here.
	if highest > 0 and level > highest then
		for _, stage in ipairs(stages) do
			if not stage.minLevel then
				return stage.index
			end
		end
	end
	return nil
end

-- Item or skill set that belongs to a stage. Guides link them in one of three ways:
-- stage numbers in braces (Maxroll: "Early Campaign {1,2}"), the same title as the
-- tree ("End-Game Gear WAND"), or the same position when there are as many sets as
-- trees (levelling trees paired with "Act 1", "Act 2"…).
local function setForStage(orderList, sets, index, spec)
	local wanted = stageNumbers(spec.title)
	if next(wanted) then
		return matchingSetId(orderList, sets, wanted)
	end
	local title = cleanTitle(spec.title)
	for _, id in ipairs(orderList or {}) do
		if cleanTitle(sets[id] and sets[id].title) == title then
			return id
		end
	end
	if #(orderList or {}) == #build.treeTab.specList then
		return orderList[index]
	end
end

-- False when the guide has gear for some stages but not for the chosen one, so a
-- levelling stage does not show end-game gear.
local stageHasItems = true

local function applyStage(index)
	local spec = build.treeTab.specList and build.treeTab.specList[index]
	if not spec then return end
	build.treeTab:SetActiveSpec(index)
	local itemSetId = setForStage(build.itemsTab.itemSetOrderList, build.itemsTab.itemSets, index, spec)
	if itemSetId then
		build.itemsTab:SetActiveItemSet(itemSetId)
	end
	stageHasItems = itemSetId ~= nil or #(build.itemsTab.itemSetOrderList or {}) <= 1
	local skillSetId = setForStage(build.skillsTab.skillSetOrderList, build.skillsTab.skillSets, index, spec)
	if skillSetId and build.skillsTab.SetActiveSkillSet then
		build.skillsTab:SetActiveSkillSet(skillSetId)
	end
	runCallback("OnFrame")
	pickMainSkill()
end

-- Allocated passives of a tree, without class and ascendancy starts.
local function specPoints(spec)
	local count = 0
	for _, node in pairs(spec.allocNodes or {}) do
		if node.type ~= "ClassStart" and node.type ~= "AscendClassStart" then
			count = count + 1
		end
	end
	return count
end

-- Without level ranges in the titles, the stage to work towards is the smallest
-- tree that still has more passives than the character has taken.
local function stageForPoints(points)
	if not points then return nil end
	local best, bestCount
	for index, spec in ipairs(build.treeTab.specList or {}) do
		local count = specPoints(spec)
		if count > points and (not bestCount or count < bestCount) then
			best, bestCount = index, count
		end
	end
	return best
end

-- The order the guide takes its ascendancy passives in. Trees are sorted by how
-- many points they spend (levelling first), and each passive is placed in the
-- Labyrinth whose two points first allow it.
local LABS = { "Normal Labyrinth", "Cruel Labyrinth", "Merciless Labyrinth", "Eternal Labyrinth" }

local function ascendancyPlan()
	local specs = {}
	for _, spec in ipairs(build.treeTab.specList or {}) do
		specs[#specs + 1] = spec
	end
	table.sort(specs, function(a, b) return specPoints(a) < specPoints(b) end)
	local seen, plan = {}, {}
	for _, spec in ipairs(specs) do
		local taken = 0
		for _, node in pairs(spec.allocNodes or {}) do
			if node.ascendancyName and node.type ~= "AscendClassStart" then
				taken = taken + 1
			end
		end
		local lab = math.max(1, math.min(#LABS, math.ceil(taken / 2)))
		local new = {}
		for id, node in pairs(spec.allocNodes or {}) do
			if node.ascendancyName and node.type ~= "AscendClassStart" and not seen[id] then
				seen[id] = true
				new[#new + 1] = { id = id, name = plainText(node.dn or node.name), notable = node.isNotable or false,
					icon = node.icon, stats = node.sd, lab = lab, labName = LABS[lab] }
			end
		end
		table.sort(new, function(a, b) return a.id < b.id end)
		for _, entry in ipairs(new) do
			plan[#plan + 1] = entry
		end
	end
	return plan
end

-- The bandit quest choice, with the reward Path of Building applies for it.
local BANDIT_REWARDS = {
	None = { label = "Kill all three", reward = "1 extra Passive Skill Point" },
	Oak = { label = "Help Oak", reward = "+40 to maximum Life" },
	Kraityn = { label = "Help Kraityn", reward = "8% increased Movement Speed" },
	Alira = { label = "Help Alira", reward = "+15% to all Elemental Resistances" },
}

local function banditChoice()
	local choice = build.configTab.input.bandit or "None"
	local entry = BANDIT_REWARDS[choice] or BANDIT_REWARDS.None
	return { choice = choice, label = entry.label, reward = entry.reward }
end

-- The guide's Pantheon powers, with every soul's effect from Path of Building's data.
local function pantheonGod(id)
	local god = id and data.pantheons and data.pantheons[id]
	if not god then return nil end
	local souls = {}
	for index, soul in ipairs(god.souls or {}) do
		local lines = {}
		for _, mod in ipairs(soul.mods or {}) do
			lines[#lines + 1] = mod.line
		end
		souls[#souls + 1] = { name = soul.name, lines = lines, upgrade = index > 1 }
	end
	local name = (god.souls and god.souls[1] and god.souls[1].name or id):gsub("^Soul of ", ""):gsub("^%l", string.upper)
	return { id = id, name = name, major = god.isMajorGod or false, souls = souls }
end

local function pantheonChoice()
	local input = build.configTab.input
	return { major = pantheonGod(input.pantheonMajorGod), minor = pantheonGod(input.pantheonMinorGod) }
end

-- Stage-wide guidance read from the guide while it is loaded.
local function guideExtras(guide)
	guide.ascendancyPlan = ascendancyPlan()
	guide.bandit = banditChoice()
	guide.pantheon = pantheonChoice()
	if not stageHasItems then
		guide.items = {}
		guide.noStageItems = true
	end
	return guide
end

local function loadGuide(xml, name, stage, level, points)
	loadBuildFromXML(xml, name or "Guide")
	recalc()
	stageHasItems = true
	local stages = listStages()
	local chosen = stage or stageForLevel(stages, level) or stageForPoints(points)
	if chosen then
		applyStage(chosen)
	end
	local active = build.treeTab.activeSpec
	for _, entry in ipairs(stages) do
		entry.active = entry.index == active
	end
	return stages
end

local function modLines(list)
	local lines = {}
	for _, mod in ipairs(list or {}) do
		if mod.line and mod.line ~= "" then
			lines[#lines + 1] = mod.line
		end
	end
	return lines
end

local function describeItem(item)
	local name = item.title or item.name
	-- Guide authors often leave rares unnamed; show the base type instead.
	if not name or name == "" or name == "New Item" then
		name = item.baseName
	end
	return {
		name = name,
		base = item.baseName,
		rarity = item.rarity,
		implicits = modLines(item.implicitModLines),
		explicits = modLines(item.explicitModLines),
	}
end

-- Equipped gear slots, ignoring jewel sockets and weapon swap.
local function gearSlots()
	local list = {}
	for slotName, slot in pairs(build.itemsTab.slots or {}) do
		if not slot.nodeId and not slotName:match("Swap") then
			list[#list + 1] = { name = slotName, slot = slot }
		end
	end
	table.sort(list, function(a, b) return a.name < b.name end)
	return list
end

-- Jewel sockets on allocated passives, in a stable order.
local function jewelSlots()
	local list = {}
	local allocated = build.spec and build.spec.allocNodes or {}
	for slotName, slot in pairs(build.itemsTab.slots or {}) do
		if slot.nodeId and allocated[slot.nodeId] and not slotName:match("Swap") then
			list[#list + 1] = { name = slotName, slot = slot }
		end
	end
	table.sort(list, function(a, b) return a.name < b.name end)
	return list
end

local function equippedItem(slot)
	local id = slot.selItemId
	if id and id ~= 0 then
		return build.itemsTab.items[id]
	end
end

-- Official icon URLs that pathofexile.com sends with the character's items,
-- keyed by Path of Building slot name. Only these URLs are ever shown; the
-- art is never copied into the app.
local INVENTORY_SLOTS = {
	Weapon = "Weapon 1", Offhand = "Weapon 2", Weapon2 = "Weapon 1 Swap", Offhand2 = "Weapon 2 Swap",
	Helm = "Helmet", BodyArmour = "Body Armour", Gloves = "Gloves", Boots = "Boots",
	Belt = "Belt", Amulet = "Amulet", Ring = "Ring 1", Ring2 = "Ring 2", Ring3 = "Ring 3",
}

-- Socketed jewels have no slot name in the profile; they are matched by name.
local function jewelKey(name)
	return "jewel:" .. tostring(name or "")
end

local function iconsBySlot(equipment, jewels)
	local icons = {}
	for _, item in ipairs(jewels or {}) do
		local icon = type(item.icon) == "string" and item.icon:match("^https://web%.poecdn%.com/") and item.icon
		if icon then
			if item.name and item.name ~= "" then icons[jewelKey(item.name)] = icon end
			if item.typeLine then icons[jewelKey(item.typeLine)] = icon end
		end
	end
	for _, item in ipairs(equipment or {}) do
		local icon = type(item.icon) == "string" and item.icon:match("^https://web%.poecdn%.com/") and item.icon
		local slot = INVENTORY_SLOTS[item.inventoryId]
		if item.inventoryId == "Flask" and tonumber(item.x) then
			slot = "Flask " .. (tonumber(item.x) + 1)
		end
		if icon and slot then
			icons[slot] = icon
		end
	end
	return icons
end

local function summarize(extra, icons)
	local out = build.calcsTab.mainOutput or {}

	local stats = {}
	for _, key in ipairs(STAT_KEYS) do
		if finite(out[key]) then
			stats[key] = out[key]
		end
	end
	stats.DPS = dps(out)

	local items = {}
	for _, entry in ipairs(gearSlots()) do
		local item = equippedItem(entry.slot)
		if item then
			local described = describeItem(item)
			described.slot = entry.name
			described.icon = icons and icons[entry.name] or nil
			items[#items + 1] = described
		end
	end
	-- Jewels in allocated passive sockets.
	for _, entry in ipairs(jewelSlots()) do
		local item = equippedItem(entry.slot)
		if item then
			local described = describeItem(item)
			described.slot = entry.name
			described.icon = icons and (icons[jewelKey(described.name)] or icons[jewelKey(described.base)]) or nil
			items[#items + 1] = described
		end
	end

	local groups = build.skillsTab.socketGroupList or {}
	local skills = {}
	for index, group in ipairs(groups) do
		local gems = {}
		for _, gem in ipairs(group.gemList or {}) do
			gems[#gems + 1] = {
				name = gem.nameSpec,
				level = gem.level,
				quality = gem.quality,
				enabled = gem.enabled ~= false,
			}
		end
		skills[#skills + 1] = {
			label = plainText(group.displayLabel or group.label),
			slot = group.slot,
			main = index == build.mainSocketGroup,
			gems = gems,
		}
	end

	local keystones = {}
	for _, node in pairs(build.spec and build.spec.allocNodes or {}) do
		if node.type == "Keystone" then
			keystones[#keystones + 1] = node.dn or node.name
		end
	end
	table.sort(keystones)

	local mainGroup = groups[build.mainSocketGroup or 0]

	local result = {
		character = {
			name = build.buildName,
			class = build.spec and build.spec.curClassName or nil,
			ascendancy = build.spec and build.spec.curAscendClassName or nil,
			level = build.characterLevel,
			mainSkill = mainGroup and plainText(mainGroup.displayLabel) or nil,
		},
		keystones = keystones,
		stats = stats,
		items = items,
		skills = skills,
	}
	for key, value in pairs(extra or {}) do
		result.character[key] = value
	end
	return result
end

-- Tries every item of the guide on the character, one slot at a time, and
-- measures how DPS and EHP change. Returns the candidates sorted by gain.
local function findUpgrades(guideItems, icons)
	local baseline = recalc()
	local baseDps, baseEhp = dps(baseline), ehp(baseline)
	local slotsByName = {}
	for _, entry in ipairs(gearSlots()) do
		slotsByName[entry.name] = entry.slot
	end

	local upgrades = {}
	for _, guideItem in ipairs(guideItems) do
		local slot = slotsByName[guideItem.slot]
		local current = slot and equippedItem(slot)
		local currentName = current and (current.title or current.name) or nil
		if slot and currentName ~= guideItem.info.name and not guideItem.slot:match("^Flask") then
			local ok, candidate = pcall(function() return new("Item"):Item(guideItem.raw) end)
			if ok and candidate and candidate.base then
				build.itemsTab:AddItem(candidate, true)
				local previous = slot.selItemId
				slot:SetSelItemId(candidate.id)
				local out = recalc()
				local newDps, newEhp = dps(out), ehp(out)
				slot:SetSelItemId(previous)
				build.itemsTab.items[candidate.id] = nil
				for index, id in ipairs(build.itemsTab.itemOrderList) do
					if id == candidate.id then
						table.remove(build.itemsTab.itemOrderList, index)
						break
					end
				end

				local function pct(new, old)
					if old > 0 then return (new - old) / old * 100 end
					return 0
				end
				upgrades[#upgrades + 1] = {
					slot = guideItem.slot,
					item = guideItem.info,
					current = currentName,
					currentIcon = icons and icons[guideItem.slot] or nil,
					dps = newDps,
					ehp = newEhp,
					dpsChange = pct(newDps, baseDps),
					ehpChange = pct(newEhp, baseEhp),
					chaosResist = out.ChaosResist,
					fireResist = out.FireResist,
					coldResist = out.ColdResist,
					lightningResist = out.LightningResist,
				}
			end
		end
	end
	recalc()

	-- Drop swaps that change nothing measurable (usually flasks).
	local meaningful = {}
	for _, upgrade in ipairs(upgrades) do
		if math.abs(upgrade.dpsChange) >= 0.5 or math.abs(upgrade.ehpChange) >= 0.5 then
			meaningful[#meaningful + 1] = upgrade
		end
	end
	upgrades = meaningful

	-- Defence counts a little more than damage: dying costs more than killing slowly.
	table.sort(upgrades, function(a, b)
		return (a.dpsChange + a.ehpChange * 1.2) > (b.dpsChange + b.ehpChange * 1.2)
	end)
	return upgrades
end

-- Allocated passives of the active tree, keyed by node id.
local function allocatedPassives()
	local nodes = {}
	for id, node in pairs(build.spec and build.spec.allocNodes or {}) do
		if node.type ~= "ClassStart" and node.type ~= "AscendClassStart" then
			nodes[id] = { id = id, name = node.dn or node.name, type = node.type, ascendancy = node.ascendancyName ~= nil }
		end
	end
	return nodes
end

-- Node ids (sorted, for the map) and chosen mastery effects of the active tree.
-- Read before another build is loaded: both come from the current spec.
local function treeSnapshot(nodes)
	local ids = {}
	for id in pairs(nodes) do
		ids[#ids + 1] = id
	end
	table.sort(ids)
	local masteries = setmetatable({}, { __jsontype = "object" })
	for id, effect in pairs(build.spec and build.spec.masterySelections or {}) do
		if nodes[id] then
			masteries[tostring(id)] = effect
		end
	end
	return ids, masteries
end

-- What the character still lacks from the guide's tree at the chosen stage.
local function comparePassives(guideNodes, characterNodes)
	local guideCount, shared = 0, 0
	local missing, extra = {}, 0
	for id, node in pairs(guideNodes) do
		guideCount = guideCount + 1
		if characterNodes[id] then
			shared = shared + 1
		elseif node.type == "Notable" or node.type == "Keystone" or node.type == "Mastery" then
			missing[#missing + 1] = node
		end
	end
	local characterCount = 0
	for id in pairs(characterNodes) do
		characterCount = characterCount + 1
		if not guideNodes[id] then
			extra = extra + 1
		end
	end
	local rank = { Keystone = 1, Notable = 2, Mastery = 3 }
	table.sort(missing, function(a, b)
		if a.ascendancy ~= b.ascendancy then return a.ascendancy end
		local ra, rb = rank[a.type] or 4, rank[b.type] or 4
		if ra ~= rb then return ra < rb end
		return (a.name or "") < (b.name or "")
	end)
	return {
		guidePoints = guideCount,
		characterPoints = characterCount,
		shared = shared,
		extra = extra,
		missing = missing,
	}
end

local result
if request.kind == "character" then
	loadCharacter(request.character)
	result = summarize({ name = request.character.name, league = request.character.league }, iconsBySlot(request.character.equipment, request.character.jewels))
elseif request.kind == "build" then
	local stages = loadGuide(request.xml, request.name, request.stage, nil)
	result = guideExtras(summarize())
	result.stages = stages
	-- The guide's tree on its own, so it can be drawn before a character is connected.
	local guideNodes = allocatedPassives()
	local passives = comparePassives(guideNodes, {})
	passives.guideNodes, passives.guideMasteries = treeSnapshot(guideNodes)
	passives.characterNodes, passives.characterMasteries = {}, setmetatable({}, { __jsontype = "object" })
	result.passives = passives
elseif request.kind == "compare" then
	local level = request.character and request.character.level
	local characterTree = request.character and request.character.passives
	local points = characterTree and characterTree.hashes and #characterTree.hashes or nil
	local stages = loadGuide(request.xml, request.name, request.stage, level, points)
	local guide = guideExtras(summarize())
	guide.stages = stages
	local guideNodes = allocatedPassives()
	local guideIds, guideMasteries = treeSnapshot(guideNodes)
	local guideItems = {}
	-- No upgrade advice from end-game gear while the guide has none for this stage.
	for _, entry in ipairs(stageHasItems and gearSlots() or {}) do
		local item = equippedItem(entry.slot)
		if item then
			guideItems[#guideItems + 1] = { slot = entry.name, raw = item:BuildRaw(), info = describeItem(item) }
		end
	end

	loadCharacter(request.character)
	local icons = iconsBySlot(request.character.equipment, request.character.jewels)
	local character = summarize({ name = request.character.name, league = request.character.league }, icons)
	local characterNodes = allocatedPassives()
	local passives = comparePassives(guideNodes, characterNodes)
	passives.guideNodes, passives.guideMasteries = guideIds, guideMasteries
	passives.characterNodes, passives.characterMasteries = treeSnapshot(characterNodes)
	result = { character = character, guide = guide, upgrades = findUpgrades(guideItems, icons), passives = passives }
else
	error("unknown request kind: " .. tostring(request.kind))
end

result.engine = { name = "Path of Building Community", version = launch and launch.versionNumber or nil }
io.write("@@POBH_RESULT@@", dkjson.encode(result), "\n")
