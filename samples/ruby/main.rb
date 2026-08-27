# frozen_string_literal: true

Theme = Data.define(:name, :accent, :background) do
  def label
    "#{name}: #{accent}"
  end
end

def tokens(theme)
  {
    keyword: '#ddca7e',
    string: theme.accent,
    comment: '#717790'
  }
end

theme = Theme.new('CodePen Theme Original', '#96b38a', '#1d1e22')
tokens(theme).each do |name, color|
  puts "#{name}: #{color}" if color.start_with?('#')
end
puts theme.label
