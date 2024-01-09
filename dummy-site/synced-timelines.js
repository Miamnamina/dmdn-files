
const _timelineIdAttr = 'data-timeline-id';
const _timelineSyncedWithAttr = 'data-timeline-synced-with';
const _trackSelector = '.w-dyn-list > div'

Number.prototype.min = function(min) {
  return (this < min) ? min : this.valueOf()
}
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max)
}

// Get all timelines that are not synced to nothing, i.e. synced timelines 
const $syncedTimelines = document.querySelectorAll(`[${_timelineIdAttr}]:not([${_timelineSyncedWithAttr}=""])`);

// Add "scroll" EventListeners to all synced timelines
//
// We are not using an arrow function here to open a new scope for every timeline.
$syncedTimelines.forEach(function($timeline) {
  // Get scrollable part of the timeline (we call this part "track")
  const $track = $timeline.querySelector(_trackSelector)
  // Get widths of timeline container and track to calculate ratios when scrolling
  $timeline.dataset.timelineWidth = $timeline.clientWidth; // width of timeline "viewport"
  $timeline.dataset.trackWidth = $track.scrollWidth; // width of the whole scrollable element
  $timeline.dataset.scrollableWidth = ($timeline.dataset.trackWidth - $timeline.dataset.timelineWidth).min(0); // number of pixels the $track can be scrolled around

  const syncedWidth = $timeline.dataset.timelineSyncedWith
    .split(',')
    .map(function(timelineId) {
      return `[${_timelineIdAttr}="${timelineId}"]`
    })
    .join(',') // selectors for all timeilnes this one is synced with
  const $syncedWith = document.querySelectorAll(syncedWidth)

  // Add the actual EventListeners to the track elements
  // TODO: debounce this using setTimeout() or getAnimationFrame() or something (s. https://developer.mozilla.org/en-US/docs/Web/API/Element/scroll_event)
  $track.addEventListener('scroll', (event) => {
    // get scroll ratio of scrolled guidelines
    const trackOffsetX = $track.scrollLeft
    const scrolledRatio = (trackOffsetX / $timeline.dataset.scrollableWidth).clamp(0, 1);

    $syncedWith.forEach(function($syncedTimeline) {
      // calculate same ratio for synced guidelines
      const scrollTo = $syncedTimeline.dataset.scrollableWidth * scrolledRatio

      // scroll the synced guidelines to this ratio in pixels
      const $syncedTrack = $syncedTimeline.querySelector(_trackSelector)
      $syncedTrack.scrollTo({ left: scrollTo }) // FIX: for some reason this 
    })
  });
})

