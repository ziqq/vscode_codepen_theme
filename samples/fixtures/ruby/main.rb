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

Token = Data.define(:name, :color)

def describe_token(token)
  case token
  in Token(name: 'keyword', color:)
    "keyword uses #{color}"
  in Token(name:, color:) if color.start_with?('#')
    "#{name} uses #{color}"
  else
    'unknown token'
  end
end

token_objects = tokens(theme).map { |name, color| Token.new(name.to_s, color) }
puts token_objects.filter_map { |token| describe_token(token) }

# ---------------------------------------------------------------------------
# Extended showcase: modules, mixins, blocks, procs, pattern matching.
# ---------------------------------------------------------------------------
require 'json'
require_relative 'support/palette'

MAX_TOKENS = 0x40
HEX_COLOR = /\A#(?<hex>\h{6})\z/i
$token_count = 0

module CodePen
  module Loggable
    def self.included(base)
      base.extend(ClassMethods)
    end

    module ClassMethods
      def loggable? = true
    end

    def log(message, level: :info, **context)
      warn "[#{self.class.name}] #{level.upcase}: #{message} #{context.inspect}"
    end
  end

  class ColorError < StandardError; end

  class Palette
    include Enumerable
    include Loggable

    attr_reader :name
    attr_accessor :opacity

    @@instances = 0

    def initialize(name, colors = {}, opacity: 0.85)
      @name = name.freeze
      @colors = colors.transform_keys(&:to_sym)
      @opacity = opacity
      @@instances += 1
    end

    def [](key) = @colors.fetch(key.to_sym) { '#ffffff' }

    def []=(key, color)
      raise ColorError, "invalid color: #{color}" unless color.match?(HEX_COLOR)

      @colors[key.to_sym] = color
      $token_count += 1
    end

    def each(&block)
      return enum_for(:each) unless block_given?

      @colors.each(&block)
      self
    end

    def to_json(*args) = { name:, colors: @colors, opacity: }.to_json(*args)

    def method_missing(name, *args)
      name.end_with?('_color') ? self[name.to_s.delete_suffix('_color')] : super
    end

    def respond_to_missing?(name, include_private = false)
      name.end_with?('_color') || super
    end

    private

    def bright?(color) = color.delete('#').to_i(16) > 0x808080

    protected

    attr_writer :name
  end
end

palette = CodePen::Palette.new('Original', { keyword: '#ddca7e', string: '#96b38a' })
square = ->(x) { x * x }
double = proc { |x| x * 2 }
bright = palette.select { |_, color| color > '#9' }.map(&:first)

case { name: 'keyword', color: '#ddca7e', weight: 3 }
in { name: String => name, color: /^#d/ => color } if name.length > 3
  puts "#{name}: #{color}"
in { weight: Integer | Float => weight }
  puts "weight #{weight}"
else
  puts 'no match'
end

begin
  palette[:accent] = 'not-a-color'
rescue CodePen::ColorError => e
  palette.log(e.message, level: :warn, attempt: 1)
  retry if (attempts = (attempts || 0) + 1) < 2
ensure
  puts square.(4), double[3], bright.inspect, palette.keyword_color, 1_000.5e-2, :symbol, %w[a b c]
end

puts <<~TEXT
  Palette #{palette.name} has #{palette.count} colors.
  Opacity: #{format('%.2f', palette.opacity)}
TEXT
