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
assert(requestPath, "usage: pobh_engine.lua <request.json> | --serve")
-- Serving: one request per line on stdin, answered one line each, until stdin closes.
-- Path of Building loads once and stays loaded, instead of seconds per request.
local serving = requestPath == "--serve"

dofile("HeadlessWrapper.lua")

local dkjson = require("dkjson")

local function readFile(path)
	local f = assert(io.open(path, "rb"))
	local text = f:read("*a")
	f:close()
	return text
end

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
	-- How far each resistance is below its own maximum (75%, or more with Purity, passives...).
	"MissingFireResist", "MissingColdResist", "MissingLightningResist", "MissingChaosResist",
	"FireResistTotal", "ColdResistTotal", "LightningResistTotal", "ChaosResistTotal",
	"ManaCost", "NetLifeRegen", "FreezeAvoidChance", "StunAvoidChance",
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
	-- Public profiles leave out the bandit choice (only a logged-in import has it), so the
	-- player tells the app which bandit they helped; it changes resistances and more.
	if character.bandit and type(character.passives) == "table" then
		character.passives.bandit_choice = character.bandit
	end
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

-- False when the guide has no gear at all for the chosen stage.
local stageHasItems = true
-- When the chosen stage has no gear of its own, the title of the nearest stage
-- (by passives spent) whose gear is shown instead.
local stageItemsFrom = nil

local function applyStage(index)
	local spec = build.treeTab.specList and build.treeTab.specList[index]
	if not spec then return end
	build.treeTab:SetActiveSpec(index)
	local itemSetId = setForStage(build.itemsTab.itemSetOrderList, build.itemsTab.itemSets, index, spec)
	stageItemsFrom = nil
	if not itemSetId and #(build.itemsTab.itemSetOrderList or {}) > 1 then
		-- Borrow the gear of the closest stage that has some, preferring the cheaper tree.
		local points, best, bestGap = specPoints(spec), nil, nil
		for other, otherSpec in ipairs(build.treeTab.specList) do
			local otherSet = other ~= index and setForStage(build.itemsTab.itemSetOrderList, build.itemsTab.itemSets, other, otherSpec)
			if otherSet then
				local gap = math.abs(specPoints(otherSpec) - points)
				if not bestGap or gap < bestGap then
					best, bestGap = otherSet, gap
					stageItemsFrom = cleanTitle(otherSpec.title)
				end
			end
		end
		itemSetId = best
	end
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
	guide.itemsFromStage = stageItemsFrom
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

-- Where each modifier comes from, read from Path of Building's own mod tables
-- (so it follows every league): a line's text, numbers replaced by "#", maps to
-- whether it rolls as a prefix or a suffix and how it is obtained.
local INFLUENCE_TAGS = {
	shaper = "Shaper", elder = "Elder", crusader = "Crusader",
	basilisk = "Hunter", eyrie = "Redeemer", adjudicator = "Warlord",
}

local function modTemplate(text)
	return (text:gsub("%(%-?[%d%.]+%-%-?[%d%.]+%)", "#"):gsub("%d+%.?%d*", "#"))
end

local modIndex
local affixTypesFor
local function modSources()
	if modIndex then return modIndex end
	modIndex = {}
	local function add(mods, source, modId, mod)
		if type(mod) ~= "table" then return end
		local influence
		for _, key in ipairs(mod.weightKey or {}) do
			local tag = key:match("_(%a+)$")
			if INFLUENCE_TAGS[tag] then influence = INFLUENCE_TAGS[tag] break end
		end
		local from = influence and "influence" or (type(modId) == "string" and modId:match("Essence") and "essence") or source
		for _, line in ipairs(mod) do
			if type(line) == "string" then
				local key = modTemplate(line)
				local entry = modIndex[key] or {}
				modIndex[key] = entry
				-- Prefix or suffix comes from the ordinary affixes first; other tables
				-- (bench, veiled, fossils...) only answer for lines that never roll normally.
				local types = (from == "explicit" or from == "influence" or from == "essence") and "rolled" or "other"
				entry[types] = entry[types] or {}
				if mod.type == "Prefix" then entry[types].prefix = true end
				if mod.type == "Suffix" then entry[types].suffix = true end
				-- The ordinary affixes, to tell prefix from suffix by what the item's base can roll.
				if types == "rolled" and (mod.type == "Prefix" or mod.type == "Suffix") then
					entry.candidates = entry.candidates or {}
					entry.candidates[#entry.candidates + 1] = mod
				end
				-- An ordinary roll wins: a line that also rolls normally needs no special source.
				if from == "explicit" then entry.ordinary = true end
				entry.sources = entry.sources or {}
				entry.sources[from] = influence or true
			end
		end
	end
	local tables = {
		{ data.itemMods.Explicit, "explicit" }, { data.itemMods.Delve, "fossil" },
		{ data.itemMods.Synthesis, "synthesis" }, { data.itemMods.Eldritch, "eldritch" },
		{ data.itemMods.Corrupted, "corruption" }, { data.veiledMods, "veiled" }, { data.masterMods, "bench" },
	}
	for _, entry in ipairs(tables) do
		for modId, mod in pairs(entry[1] or {}) do
			add(entry[1], entry[2], modId, mod)
		end
	end
	return modIndex
end

-- Whether a mod can roll on a base: the first of its weight keys the base has decides,
-- as in the game ("default" matches every base).
local function canRollOn(mod, tags)
	for index, key in ipairs(mod.weightKey or {}) do
		if key == "default" or tags[key] then
			return (mod.weightVal and mod.weightVal[index] or 0) > 0
		end
	end
	return false
end

-- Prefix or suffix among the ordinary affixes that can roll on this item's base.
affixTypesFor = function(candidates, item)
	local tags = item.base and item.base.tags or {}
	local types = {}
	for _, mod in ipairs(candidates or {}) do
		if canRollOn(mod, tags) then
			if mod.type == "Prefix" then types.prefix = true end
			if mod.type == "Suffix" then types.suffix = true end
		end
	end
	return types
end

-- The special source of a line, when it does not also roll as an ordinary affix.
local function specialSource(entry)
	if not entry or entry.ordinary then return nil end
	for _, source in ipairs({ "influence", "essence", "fossil", "veiled", "synthesis", "eldritch", "corruption", "bench" }) do
		local value = entry.sources and entry.sources[source]
		if value then return source, type(value) == "string" and value or nil end
	end
end

-- Every line of an item, tagged with its kind, so the read-out can colour it like the game does.
local function describeMods(item)
	local mods = {}
	local unique = item.rarity == "UNIQUE" or item.rarity == "RELIC"
	local index = modSources()
	local function push(list, kind)
		for _, mod in ipairs(list or {}) do
			if mod.line and mod.line ~= "" then
				local entry = { text = mod.line, kind = kind }
				local found = index[modTemplate(mod.line)]
				if kind == "implicit" then
					if mod.exarch then entry.kind, entry.source, entry.detail = "eldritch", "eldritch", "Searing Exarch"
					elseif mod.eater then entry.kind, entry.source, entry.detail = "eldritch", "eldritch", "Eater of Worlds"
					elseif mod.synthesis then entry.source = "synthesis"
					elseif item.corrupted and found and found.sources and found.sources.corruption then entry.kind, entry.source = "corrupted", "corruption"
					end
				elseif kind == "explicit" then
					if mod.crafted then entry.kind, entry.source = "crafted", "bench"
					elseif mod.scourge then entry.kind = "scourge"
					elseif mod.crucible then entry.kind = "crucible"
					elseif unique then entry.kind = "unique"
					end
					if mod.fractured then entry.fractured = true end
					if found and entry.kind ~= "unique" and entry.kind ~= "crucible" and entry.kind ~= "scourge" then
						local types = found.rolled or found.other or {}
						if types.prefix and types.suffix then types = affixTypesFor(found.candidates, item) end
						if types.prefix and not types.suffix then entry.affix = "prefix"
						elseif types.suffix and not types.prefix then entry.affix = "suffix" end
						if not entry.source then entry.source, entry.detail = specialSource(found) end
					end
				end
				mods[#mods + 1] = entry
			end
		end
	end
	push(item.enchantModLines, "enchant")
	push(item.scourgeModLines, "scourge")
	push(item.implicitModLines, "implicit")
	push(item.explicitModLines, "explicit")
	push(item.crucibleModLines, "crucible")
	return mods
end

local function itemInfluences(item)
	local list = {}
	for key, name in pairs({ shaper = "Shaper", elder = "Elder", crusader = "Crusader", redeemer = "Redeemer", hunter = "Hunter", warlord = "Warlord" }) do
		if item[key] then list[#list + 1] = name end
	end
	table.sort(list)
	return list
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
		mods = describeMods(item),
		corrupted = item.corrupted or nil,
		influences = itemInfluences(item),
		-- The item as Path of Building writes it, so the Forge can open it later.
		raw = item:BuildRaw(),
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

-- ---------------------------------------------------------------------------
-- The Forge: an item's base and everything around it, from Path of Building's
-- own data (so it follows every league): the tier of each modifier it has, its
-- free prefixes and suffixes, what else can roll on it at its item level, the
-- essences and bench crafts that apply, and for uniques, their league and source.

-- "Drops from unique{The Shaper}" -> "Drops from The Shaper".
local function plainMarkup(text)
	return (plainText(text or ""):gsub("%a+{([^}]*)}", "%1"))
end

local uniqueInfo
local function uniqueDetails(name)
	if not uniqueInfo then
		uniqueInfo = {}
		for _, list in pairs(data.uniques or {}) do
			for _, raw in ipairs(type(list) == "table" and list or {}) do
				if type(raw) == "string" then
					local first = raw:match("^%s*([^\r\n]+)")
					if first and not uniqueInfo[first] then
						uniqueInfo[first] = {
							league = raw:match("\nLeague: ([^\r\n]+)"),
							source = plainMarkup(raw:match("\nSource: ([^\r\n]+)")),
						}
					end
				end
			end
		end
	end
	local found = uniqueInfo[name] or {}
	return found.league, found.source ~= "" and found.source or nil
end

-- The first range of a modifier line, e.g. "+(30-35)% to Fire Resistance" -> 30, 35.
local function firstRange(text)
	local low, high = text:match("%((%-?[%d%.]+)%-(%-?[%d%.]+)%)")
	if low then
		low, high = tonumber(low), tonumber(high)
		return math.min(low, high), math.max(low, high)
	end
	local fixed = tonumber(text:match("%-?%d+%.?%d*"))
	return fixed, fixed
end

local function lineText(mod)
	local lines = {}
	for _, line in ipairs(mod) do
		if type(line) == "string" then lines[#lines + 1] = line end
	end
	return table.concat(lines, " / ")
end

local function influenceOf(mod)
	for _, key in ipairs(mod.weightKey or {}) do
		local tag = key:match("_(%a+)$")
		if INFLUENCE_TAGS[tag] then return INFLUENCE_TAGS[tag] end
	end
end

-- A modifier line with each range at its middle: "+(30-35)% to Fire Resistance" -> "+32% ...".
local function midValue(line)
	return (line:gsub("%((%-?[%d%.]+)%-(%-?[%d%.]+)%)", function(low, high)
		local a, b = tonumber(low), tonumber(high)
		local mid = (a + b) / 2
		if low:find("%.") or high:find("%.") then
			return string.format("%.1f", mid)
		end
		return tostring(math.floor(mid))
	end))
end

-- DPS and EHP of the loaded character with `raw` worn in `slot` instead of its own item.
local function tryItemIn(slot, raw)
	local ok, candidate = pcall(function() return new("Item", raw) end)
	if not ok or not candidate or not candidate.base then return nil end
	build.itemsTab:AddItem(candidate, true)
	local previous = slot.selItemId
	slot:SetSelItemId(candidate.id)
	local out = recalc()
	local result = { dps = dps(out), ehp = ehp(out) }
	slot:SetSelItemId(previous)
	build.itemsTab.items[candidate.id] = nil
	for index, id in ipairs(build.itemsTab.itemOrderList) do
		if id == candidate.id then
			table.remove(build.itemsTab.itemOrderList, index)
			break
		end
	end
	return result
end

local function forge(raw, slotName)
	local item = new("Item", raw)
	assert(item.base, "The archive does not know this item's base type.")
	local name = item.title or item.name
	local unique = item.rarity == "UNIQUE" or item.rarity == "RELIC"
	local info = {
		name = name,
		base = item.baseName,
		itemClass = item.type,
		rarity = item.rarity,
		itemLevel = item.itemLevel,
		influences = itemInfluences(item),
		corrupted = item.corrupted or nil,
		mods = describeMods(item),
		unique = unique or nil,
	}
	if unique then
		info.league, info.source = uniqueDetails(name)
		return info
	end

	-- Everything that can roll on this base at this item level, grouped by modifier family.
	local itemLevel = tonumber(item.itemLevel) or 100
	local groups, byKey = {}, {}
	for modId, mod in pairs(data.itemMods.Explicit or {}) do
		if (mod.type == "Prefix" or mod.type == "Suffix") and (mod.level or 1) <= itemLevel then
			local weight = item:GetModSpawnWeight(mod) or 0
			if weight > 0 then
				local key = (mod.group or modId) .. "|" .. mod.type .. "|" .. (influenceOf(mod) or "")
				local group = byKey[key]
				if not group then
					group = { affix = mod.type:lower(), influence = influenceOf(mod), tiers = {}, weight = 0 }
					byKey[key] = group
					groups[#groups + 1] = group
				end
				group.weight = group.weight + weight
				group.tiers[#group.tiers + 1] = { level = mod.level or 1, text = lineText(mod), weight = weight, mod = mod }
			end
		end
	end
	local totals = { prefix = 0, suffix = 0 }
	for _, group in ipairs(groups) do
		table.sort(group.tiers, function(a, b) return a.level > b.level end)
		group.text = group.tiers[1].text
		totals[group.affix] = totals[group.affix] + group.weight
	end

	-- The tier of each modifier the item has, and the families it already uses.
	local used = { prefix = 0, suffix = 0 }
	local owned = {}
	for _, entry in ipairs(info.mods) do
		if entry.kind == "explicit" or entry.kind == "crafted" then
			local template = modTemplate(entry.text)
			local value = tonumber(entry.text:match("%-?%d+%.?%d*"))
			for _, group in ipairs(groups) do
				for index, tier in ipairs(group.tiers) do
					local matches = false
					for _, line in ipairs(tier.mod) do
						if type(line) == "string" and modTemplate(line) == template then
							local low, high = firstRange(line)
							if not value or not low or (value >= low and value <= high) then matches = true end
						end
					end
					if matches and entry.kind == "explicit" and (not entry.affix or entry.affix == group.affix) then
						entry.tier, entry.tiers, entry.affix = index, #group.tiers, group.affix
						if not owned[group] then
							owned[group] = true
							group.owned = true
							used[group.affix] = used[group.affix] + 1
						end
						break
					end
				end
				if entry.tier then break end
			end
			-- A bench craft takes an affix of its own.
			if entry.kind == "crafted" and entry.affix and not entry.counted then
				entry.counted = true
				used[entry.affix] = used[entry.affix] + 1
			end
		end
	end

	local limit = item.rarity == "MAGIC" and 1 or ((item.affixLimit and item.affixLimit > 0) and item.affixLimit / 2 or 3)
	if item.rarity == "NORMAL" then limit = 0 end
	info.slots = {
		prefix = { used = used.prefix, max = limit },
		suffix = { used = used.suffix, max = limit },
	}

	local pool = { prefix = {}, suffix = {} }
	for _, group in ipairs(groups) do
		local tiers = {}
		for index, tier in ipairs(group.tiers) do
			tiers[index] = { tier = index, level = tier.level, text = tier.text }
		end
		pool[group.affix][#pool[group.affix] + 1] = {
			text = group.text,
			tiers = tiers,
			chance = totals[group.affix] > 0 and math.floor(group.weight / totals[group.affix] * 1000 + 0.5) / 10 or 0,
			influence = group.influence,
			owned = group.owned or nil,
			_group = group,
		}
	end
	-- With the character loaded and the item in one of its slots: how much each
	-- modifier the item does not have would change the character's DPS and EHP,
	-- at the best tier its item level allows, with mid rolls.
	local slot
	if slotName and build then
		for _, entry in ipairs(gearSlots()) do
			if entry.name == slotName then slot = entry.slot end
		end
	end
	if slot then
		local base = recalc()
		local baseDps, baseEhp = dps(base), ehp(base)
		local itemRaw = item:BuildRaw()
		local function pct(new, old)
			if old > 0 then return math.floor((new - old) / old * 1000 + 0.5) / 10 end
			return 0
		end
		for _, affix in ipairs({ "prefix", "suffix" }) do
			for index, entry in ipairs(pool[affix]) do
				local group = entry._group
				if not entry.owned and group then
					local lines = {}
					for _, line in ipairs(group.tiers[1].mod) do
						if type(line) == "string" then lines[#lines + 1] = midValue(line) end
					end
					local measured = tryItemIn(slot, itemRaw .. "\n" .. table.concat(lines, "\n"))
					if measured then
						entry.dps = pct(measured.dps, baseDps)
						entry.ehp = pct(measured.ehp, baseEhp)
					end
				end
			end
		end
		recalc()
		info.measured = true
	end
	for _, list in pairs(pool) do
		for _, entry in ipairs(list) do entry._group = nil end
		table.sort(list, function(a, b)
			if (a.owned or false) ~= (b.owned or false) then return a.owned or false end
			return a.chance > b.chance
		end)
	end
	info.pool = pool

	-- Essences that guarantee a modifier on this kind of item: the strongest of each.
	local essences, bestOf = {}, {}
	for _, essence in pairs(data.essences or {}) do
		local modId = essence.mods and essence.mods[item.type]
		local mod = modId and data.itemMods.Item[modId]
		if mod then
			local family = essence.name:match("of (.+)$") or essence.name
			local best = bestOf[family]
			if not best or (essence.tier or 0) > (best.tier or 0) then
				bestOf[family] = { name = essence.name, tier = essence.tier or 0, text = lineText(mod), affix = mod.type and mod.type:lower() or nil }
			end
		end
	end
	for _, essence in pairs(bestOf) do
		essences[#essences + 1] = { name = essence.name, text = essence.text, affix = essence.affix }
	end
	table.sort(essences, function(a, b) return a.name < b.name end)
	info.essences = essences

	-- Crafting bench options for this kind of item: the strongest of each family.
	local bench, benchBest = {}, {}
	for _, mod in pairs(data.masterMods or {}) do
		if type(mod) == "table" and mod.types and mod.types[item.type] and (mod.type == "Prefix" or mod.type == "Suffix") then
			local key = (mod.group or lineText(mod)) .. "|" .. mod.type
			local best = benchBest[key]
			if not best or (mod.level or 0) > (best.level or 0) then
				benchBest[key] = { level = mod.level or 0, text = lineText(mod), affix = mod.type:lower() }
			end
		end
	end
	for _, craft in pairs(benchBest) do
		bench[#bench + 1] = { text = craft.text, affix = craft.affix }
	end
	table.sort(bench, function(a, b)
		if a.affix ~= b.affix then return a.affix < b.affix end
		return a.text < b.text
	end)
	info.bench = bench
	return info
end

-- ---------------------------------------------------------------------------
-- The tree optimizer: the character's best next passives. Every notable and
-- keystone a few points away is tried with the path to it, on the character,
-- and ranked by what it adds per point spent (damage and survival).

local OPTIMIZER_REACH = 7
local OPTIMIZER_TRIES = 250

local function bestPassives(limit)
	local spec = build.spec
	spec:BuildAllDependsAndPaths()
	recalc()
	-- Path of Building's own quick calculator (the one behind its node power view):
	-- it adds nodes to a copy of the build without touching the tree or rebuilding it.
	local calcFunc, base = build.calcsTab:GetMiscCalculator()
	local baseDps, baseEhp = dps(base), ehp(base)
	local function pct(new, old)
		if old > 0 then return (new - old) / old * 100 end
		return 0
	end

	local candidates = {}
	for _, node in pairs(spec.nodes or {}) do
		if not node.alloc and node.path and node.pathDist and node.pathDist >= 1 and node.pathDist <= OPTIMIZER_REACH
			and (node.type == "Notable" or node.type == "Keystone") and not node.ascendancyName then
			candidates[#candidates + 1] = node
		end
	end
	table.sort(candidates, function(a, b)
		if a.pathDist ~= b.pathDist then return a.pathDist < b.pathDist end
		return (a.id or 0) < (b.id or 0)
	end)

	local results = {}
	for index = 1, math.min(#candidates, OPTIMIZER_TRIES) do
		local node = candidates[index]
		local path, added = {}, {}
		for _, step in ipairs(node.path) do
			path[#path + 1] = step
			added[step] = true
		end
		local out = calcFunc({ addNodes = added }, true)
		local dpsChange, ehpChange = pct(dps(out), baseDps), pct(ehp(out), baseEhp)
		local points = #path
		local score = (dpsChange + ehpChange * 1.2) / math.max(1, points)
		if score > 0.05 then
			local ids = {}
			for _, step in ipairs(path) do ids[#ids + 1] = step.id end
			results[#results + 1] = {
				id = node.id,
				name = node.dn or node.name,
				type = node.type,
				points = points,
				path = ids,
				dps = math.floor(dpsChange * 10 + 0.5) / 10,
				ehp = math.floor(ehpChange * 10 + 0.5) / 10,
				perPoint = math.floor(score * 100 + 0.5) / 100,
			}
		end
	end
	table.sort(results, function(a, b) return a.perPoint > b.perPoint end)
	local best = {}
	for index = 1, math.min(#results, limit or 10) do best[index] = results[index] end
	return { passives = best, tried = math.min(#candidates, OPTIMIZER_TRIES), reach = OPTIMIZER_REACH }
end

local function handle(request)
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
elseif request.kind == "best_passives" then
	loadCharacter(assert(request.character, "Connect a character first."))
	result = bestPassives(request.limit or 10)
elseif request.kind == "forge" then
	-- With the character, the Forge also measures each modifier on it.
	if request.character and request.slot then loadCharacter(request.character) end
	result = forge(assert(request.raw, "No item to open in the Forge."), request.character and request.slot or nil)
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
return result
end

if serving then
	io.write("@@POBH_READY@@\n")
	io.stdout:flush()
	for line in io.stdin:lines() do
		if line:match("%S") then
			local request = dkjson.decode(line)
			local ok, result = pcall(function()
				return handle(assert(type(request) == "table" and request, "request is not valid JSON"))
			end)
			if ok then
				io.write("@@POBH_RESULT@@", dkjson.encode(result), "\n")
			else
				io.write("@@POBH_ERROR@@", (tostring(result):gsub("[\r\n]+", " ")), "\n")
			end
			io.stdout:flush()
		end
	end
else
	local request = assert(dkjson.decode(readFile(requestPath)), "request is not valid JSON")
	io.write("@@POBH_RESULT@@", dkjson.encode(handle(request)), "\n")
end
