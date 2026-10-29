-- Tables, metatables, methods, varargs, loops, and string interpolation.
local Theme = {}
Theme.__index = Theme

function Theme.new(name, accent, tokens)
  return setmetatable({
    name = name or "CodePen Theme Original",
    accent = accent or "#96b38a",
    tokens = tokens or {},
  }, Theme)
end

function Theme:label(prefix)
  return string.format("%s: %s (%s)", prefix or "theme", self.name, self.accent)
end

function Theme:visible_tokens(...)
  local hidden = { ... }
  local result = {}
  for index, token in ipairs(self.tokens) do
    if token ~= hidden[1] then
      result[index] = token:upper()
    end
  end
  return result
end

local original = Theme.new(nil, nil, { "keyword", "string", "comment" })
print(original:label(), table.concat(original:visible_tokens("comment"), ", "))

-- ---------------------------------------------------------------------------
-- Extended showcase: metatables, closures, varargs, coroutines, pcall.
-- ---------------------------------------------------------------------------
local MAX_TOKENS <const> = 0x40
local HEX_PATTERN = "^#%x%x%x%x%x%x$"

local Palette = {}
Palette.__index = Palette

function Palette.new(colors)
  local self = setmetatable({ colors = colors or {}, hits = 0 }, Palette)
  return self
end

function Palette:get(name)
  self.hits = self.hits + 1
  return self.colors[name] or "#ffffff"
end

function Palette:set(name, color)
  if type(color) ~= "string" or not color:match(HEX_PATTERN) then
    error(("invalid color %q for %s"):format(tostring(color), name), 2)
  end
  self.colors[name] = color:lower()
end

Palette.__len = function(self)
  local count = 0
  for _ in pairs(self.colors) do count = count + 1 end
  return count
end

Palette.__tostring = function(self)
  return "Palette(" .. #self .. " colors)"
end

local function counter(start)
  local value = start or 0
  return function(step)
    value = value + (step or 1)
    return value
  end
end

local function sum(...)
  local total = 0
  for _, v in ipairs({ ... }) do total = total + v end
  return total, select("#", ...)
end

local producer = coroutine.wrap(function()
  for index, role in ipairs({ "keyword", "string", "comment" }) do
    coroutine.yield(index, role)
  end
end)

local palette = Palette.new({ keyword = "#DDCA7E", string = "#96b38a" })
local ok, err = pcall(palette.set, palette, "accent", "not-a-color")
if not ok then
  print("error:", err)
elseif #palette > MAX_TOKENS then
  goto finish
end

local next_id = counter(10)
local total, count = sum(1, 2.5, 3e2, 0xff)
print(tostring(palette), next_id(), next_id(5), total, count, producer())
print(string.format("%-10s %5.2f", "ratio", 2 ^ 3 // 3 % 2), [[long
string]], nil == false, not true)
::finish::
