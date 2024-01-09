
const _timelineIdAttr = 'data-timeline-id';
const _timelineSyncedWithAttr = 'data-timeline-synced-with';
const _trackSelector = '.w-dyn-list > div'

/**
  * Set minimum value of a Number
  */
Number.prototype.min = function(min) {
  return (this < min) ? min : this.valueOf()
}
/**
  * Set minimum and maximum values of a Number
  */
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max)
}

/**
  * Get all timelines that are not synced to nothing, i.e. synced timelines
  */
const $syncedTimelines = document.querySelectorAll(`[${_timelineIdAttr}]:not([${_timelineSyncedWithAttr}=""])`);

/**
  * Add "scroll" EventListeners to all synced timelines
  *
  * We are not using an arrow function here to open a new scope for every timeline.
  */
$syncedTimelines.forEach(function($timeline) {
  /**
    * Get scrollable part of the timeline (we call this part "track")
    */
  const $track = $timeline.querySelector(_trackSelector)
  /**
    * Get widths of timeline container and track to calculate ratios when scrolling
    */
  // width of timeline "viewport"
  $timeline.dataset.timelineWidth = $timeline.clientWidth;
  // width of the whole scrollable element
  $timeline.dataset.trackWidth = $track.scrollWidth;
  // number of pixels the $track can be scrolled around
  $timeline.dataset.scrollableWidth = ($timeline.dataset.trackWidth - $timeline.dataset.timelineWidth).min(0);

  /**
   * selectors for all timeilnes this one is synced with
   *
   * TODO: maybe create a function to handle this conversion and clean up a little here?
   */
  const syncedWidth = $timeline.dataset.timelineSyncedWith
    .split(',') // split the comma-separated list into an array (TODO: this might not be necessary if we use group ids to sync multiple timelines)
    .map(function(timelineId) { // create valid selectors from the ids
      return `[${_timelineIdAttr}="${timelineId}"]`
    })
    .join(',') // create a valid CSS selector string from the selectors array
  /**
   * Get all synced timelines from the DOM to run scrollTo() on them
   */
  const $syncedWith = document.querySelectorAll(syncedWidth)

  /**
    * Add the actual EventListeners to the track elements
    *
    * TODO: debounce this using setTimeout() or getAnimationFrame() or something (s. https://developer.mozilla.org/en-US/docs/Web/API/Element/scroll_event)
    */
  $track.addEventListener('scroll', () => {
    /**
      * get scroll ratio of scrolled guidelines
      */
    const scrolledRatio = ($track.scrollLeft / $timeline.dataset.scrollableWidth).clamp(0, 1);

    /**
      * For each synced timeline scroll to the same position relative to the scrollable width
      */
    $syncedWith.forEach(function($syncedTimeline) {
      /**
        * calculate same ratio for synced guidelines
        */
      const scrollTo = $syncedTimeline.dataset.scrollableWidth * scrolledRatio

      /**
        * scroll the synced guidelines to this ratio in pixels
        */
      const $syncedTrack = $syncedTimeline.querySelector(_trackSelector)
      /**
       * FIX: for some reason this does not work on right-most handful of pixels
       *      probably due to some clamping issues or padding/margin/offset inaccuracies
       */
      console.log($syncedTimeline, $timeline)
      if ($syncedTimeline.dataset.timelineId !== $timeline.dataset.timelineId) {
        $syncedTrack.scrollTo({ left: scrollTo })
      }
    })
  });
})

