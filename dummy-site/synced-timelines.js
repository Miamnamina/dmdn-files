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
const visTimelines = {}

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

  const data = new vis.DataSet([
    ...Array.from($events).map(function($event, idx) {
      const data = {
        id: idx,
        start: $event.dataset.startdate,
        end: null,
        content: $event,
        active: false
      }
      if ($event.dataset.enddate !== undefined) {
        data.end = $event.dataset.enddate
      }

      return data
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
    zoomMin: 315360000000000 / 1000 / 2, // 5 years
    showCurrentTime: false,
    template: function(item, element, data) {
      const $dateLine = data.content.querySelector('.event-line.time');

      if ($dateLine !== null) {
        $dateLine.innerText = data.start.toLocaleDateString() + ' - ' + data.end?.toLocaleDateString()
      }

      return data.content
    },
  }

  const timeline = new vis.Timeline($container, data, options);
  visTimelines[$timeline.dataset.timelineId] = timeline
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

  timeline.on('rangechange', handleTimelineSync)

  /**
   * TODO: Add comments to this file!
   */
  function handleTimelineSync(event) {
    /**
     * The idea of this pattern was to return a new handler for each timeline that does not run the
     * `timeline.setWindow()` method on the timeline that is currently being actively scrolled.
     */
    const $eventTarget = event.event?.target !== undefined ? event.event.target.closest('.timeline-viewport') : undefined
    const targetTimelineIds = $timeline.dataset.timelineSyncedWith.split(',')

    targetTimelineIds.forEach(function(targetTimelineId) {
      if ($eventTarget !== undefined && targetTimelineId !== $eventTarget.dataset.timelineId) {
        visTimelines[targetTimelineId].setWindow(event.start, event.end, { animation: { duration: 200, easingFunction: 'easeInOutQuad' } })
      }
    })
  }

  /**
   * Hide original track with JS, so it looks nice even if JS is disabled
   */
  const $track = $timeline.querySelector(_trackSelector)
  $track.style.display = 'none'; // hide original track
})
