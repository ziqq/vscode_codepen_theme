// Refinements are foreground-only unless a provider has replaced documentation
// or the Dart Function type with a keyword font style.
class Spans {
  constructor(length) {
    this.length = length;
    this.items = [];
  }

  add(start, end, role, priority = 10, fontStyle) {
    if (start < 0 || end > this.length || start >= end) return;
    this.items.push({ start, end, role, priority, fontStyle, order: this.items.length });
  }

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
