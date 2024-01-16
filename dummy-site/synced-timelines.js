/**
 * TODO: Implement methods for fetching dataset values with a default return value in case the data attribute does not exist
 */

/**
 * Define selectors for simple configuration
 */
const _timelineIdAttr = 'data-timeline-id';
const _timelineSyncedWithAttr = 'data-timeline-synced-with';
const _trackSelector = '.timeline-track';
const _eventSelector = '.timeline-event';
const _eventStartDateAttr = 'data-startdate';
const _eventEndDateAttr = 'data-enddate';

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
const $timelines = document.querySelectorAll(`[${_timelineIdAttr}]`);
const $syncedTimelines = document.querySelectorAll(`[${_timelineIdAttr}]:not([${_timelineSyncedWithAttr}=""])`);
const visTimelines = []

/**
 * Figure out whether events overlap and put them into different lanes.
 *
 * This always prepares a first lane and adds other lanes on demand.
 */
$timelines.forEach(function($timeline) {
  // TODO: create a function for this
  const $events = $timeline.querySelectorAll(_eventSelector)
  $($timeline).append('<div class="vis-timeline"></div>')

  const $container = $timeline.querySelector('.vis-timeline')


  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  let minimumDate = Date.now()
  let maximumDate = Date.now()

  const data = new vis.DataSet([
    ...Array.from($events).map(function($event, idx) {
      const item = {
        id: idx,
        start: $event.dataset.startdate,
        end: $event.dataset.enddate,
        content: $event,
        active: false
      }

      let eventStartdate = new Date($event.dataset.startdate)
      let eventEnddate = new Date($event.dataset.enddate)
      if (eventStartdate < minimumDate) {
        minimumDate = eventStartdate
      }
      if (eventEnddate > maximumDate) {
        maximumDate = eventEnddate
      }

      return item
    }),
  ])

  const options = {
    zoomable: false,
    horizontalScroll: true,
    locale: 'de',
    selectable: false,
    showMajorLabels: false,
    showMinorLabels: false,
    showTooltips: false,
    stack: true,
    stackSubgroups: true,
    timeAxis: {
      scale: 'year',
      step: 1
    },
    //min: minimumDate,
    //max: maximumDate,
    showCurrentTime: false,
    template: function(item, element, data) {
      const $dateLine = data.content.querySelector('.event-line.time');

      if ($dateLine !== null) {
        $dateLine.innerText = data.start.toLocaleDateString() + ' - ' + data.end?.toLocaleDateString()
      }

      if (data.active === true) {
        data.content.className = 'timeline-event active'
      } else {
        data.content.className = 'timeline-event'
      }
      return data.content
    },
  }

  const timeline = new vis.Timeline($container, data, options);
  //console.log(timeline)

  const $background = $timeline.querySelector('.vis-panel.vis-background')
  $($background).append('<div class="marker"></div>')
  const $marker = $timeline.querySelector('.marker')
  const markerXleft = $marker.getBoundingClientRect().left
  const markerXright = $marker.getBoundingClientRect().right

  /**
   * Make sure to add/remove the 'active' class on the overflow container when it touches the $marker
   */
  function handleActiveStates(event) {
    const $overflowItems = $timeline.querySelectorAll('.vis-item-overflow')

    $overflowItems.forEach(function($item) {
      const itemRect = $item.getBoundingClientRect()

      if (itemRect.left < markerXright && itemRect.right > markerXleft) {
        $($item).addClass('active')
      } else {
        $($item).removeClass('active')
      }
    })
  }

  /**
   * Bind eventlisteners for items active state
   */
  timeline.on('changed', handleActiveStates)

  /**
   * Hide original track with JS, so it looks nice even if JS is disabled
   */
  const $track = $timeline.querySelector(_trackSelector)
  $track.style.display = 'none'; // hide original track
})

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
   */
  const syncedWidthSelectors = convertSyncedWithToSelectors($timeline.dataset.timelineSyncedWith)
  /**
* Get all synced timelines from the DOM to run scrollTo() on them
*/
  const $syncedWith = document.querySelectorAll(syncedWidthSelectors)

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
      if ($syncedTimeline.dataset.timelineId !== $timeline.dataset.timelineId) {
        $syncedTrack.scrollTo({ left: scrollTo })
      }
    })
  });
})

/**
 * Functions section
 */
function convertSyncedWithToSelectors(syncedWith) {
  return syncedWith
    .split(',') // split the comma-separated list into an array (TODO: this might not be necessary if we use group ids to sync multiple timelines)
    .map(function(timelineId) { // create valid selectors from the ids
      return `[${_timelineIdAttr}="${timelineId}"]`
    })
    .join(',') // create a valid CSS selector string from the selectors array
}
