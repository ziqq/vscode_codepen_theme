/**
 * @file Resolve overlapping lexical and structural corrections into disjoint source ranges.
 * All positions use UTF-16 code units and half-open intervals [start, end).
 */

/**
 * @typedef {'white' | 'yellow' | 'blue' | 'purple' | 'green' | 'orange' | 'brown' | 'gray' | 'operator'} Role
 * Foreground roles mapped through the shared palette, never literal provider colors.
 */

/**
 * @typedef {object} Span
 * @property {number} start Inclusive UTF-16 source offset.
 * @property {number} end Exclusive UTF-16 source offset.
 * @property {Role} role Palette role applied to every character in the range.
 * @property {string} [fontStyle] Optional explicit typography or the annotation sentinel.
 */

/**
 * @typedef {Span & {priority: number, order: number}} PrioritizedSpan
 * Internal correction before overlap resolution; later additions break priority ties.
 */

// Refinements are foreground-only unless a provider has replaced documentation
// or the Dart Function type with a keyword font style.
/**
 * Collect foreground corrections before resolving their overlaps.
 * Higher priority wins; the most recently added span wins an equal-priority tie.
 * Adjacent winning intervals with the same role and typography are coalesced.
 */
class Spans {
  /**
   * @param {number} length Original document length in UTF-16 code units.
   */
  constructor(length) {
    this.length = length;
    /** @type {PrioritizedSpan[]} Corrections in insertion order. */
    this.items = [];
  }

  /**
   * Add a half-open correction; invalid or empty ranges are ignored.
   *
   * @param {number} start Inclusive source offset.
   * @param {number} end Exclusive source offset.
   * @param {Role} role Shared foreground role.
   * @param {number} [priority=10] Layer precedence; larger numbers win.
   * @param {string} [fontStyle] Explicit typography or annotation sentinel.
   * @returns {void} The original source and existing corrections are unchanged.
   */
  add(start, end, role, priority = 10, fontStyle) {
    if (start < 0 || end > this.length || start >= end) return;
    this.items.push({ start, end, role, priority, fontStyle, order: this.items.length });
  }

  /**
   * Resolve start/end events into sorted, non-overlapping winning ranges.
   *
   * @returns {Span[]} Final ranges suitable for editor decorations or color assertions.
   */
  finish() {
    const events = this.items.flatMap((item) => [
      { at: item.start, item, open: true }, { at: item.end, item, open: false },
    ]).sort((a, b) => a.at - b.at);
    const active = new Map();
    const result = [];
    let previous = 0;
    for (let index = 0; index < events.length;) {
      const at = events[index].at;
      const winner = [...active.values()].sort((a, b) =>
        b.priority - a.priority || b.order - a.order)[0];
      if (winner && previous < at) {
        const last = result[result.length - 1];
        if (last?.end === previous && last.role === winner.role &&
            last.fontStyle === winner.fontStyle) last.end = at;
        else result.push({ start: previous, end: at, role: winner.role,
          ...(winner.fontStyle ? { fontStyle: winner.fontStyle } : {}) });
      }
      // Apply every event at this boundary before considering the next interval;
      // zero-width transitions must never produce a decoration of their own.
      while (index < events.length && events[index].at === at) {
        const { item, open } = events[index++];
        if (open) active.set(item.order, item);
        else active.delete(item.order);
      }
      previous = at;
    }
    return result;
  }
}

module.exports = { Spans };
