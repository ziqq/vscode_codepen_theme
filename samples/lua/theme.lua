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
