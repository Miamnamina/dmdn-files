/**
 * Define selectors for simple configuration
 */
const _timelineIdAttr = 'data-timeline-id';
const _timelineSyncedWithAttr = 'data-timeline-synced-with';
const _trackSelector = '[data-timeline-track]';
const _eventSelector = '[data-event-id]';
const _eventStartDateAttr = 'data-startdate';
const _eventEndDateAttr = 'data-enddate';
const _visTimelineClass = 'vis-timeline';
const _visTimelineSelector = '.' + _visTimelineClass;
const $visTimelineContainerMarkup = `<div class="${_visTimelineClass}"></div>`;
const _visOverflowSelector = '.vis-item-overflow';
const _visBackgroundSelector = '.vis-panel.vis-background';
const _markerClass = 'marker'
const _markerSelector = '.' + _markerClass;
const $markerMarkup = `<div class="${_markerClass}"></div>`;
const _activeClass = 'active';
const _timelineViewportSelector = `[${_timelineIdAttr}]`;
const _timelineZoomAttr = 'data-timeline-zoom';
const _yearInMs = 1 * 365 * 24 * 60 * 60 * 1000; // 1 year in miliseconds

/**
  * Set minimum value of a Number
  *
  * @prop {number} min
  */
Number.prototype.min = function(min) {
  return (this < min) ? min : this.valueOf()
}
/**
  * Set minimum and maximum values of a number
  *
  * @prop {number} min
  * @prop {number} max
  */
Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max)
}

/**
  * Get all timelines that are not synced to nothing, i.e. synced timelines
  */
const $timelines = document.querySelectorAll(`[${_timelineIdAttr}]`);

/**
  * This will hold all the vis-timeline instances so we can address each of them
  * when we want to scroll the synced timelines.
  */
const visTimelines = {}

/**
 * Prepare data from $event DOM node for vis-timeline
 *
 * @prop {object} $event - .timeline-event node
 * @prop {number} idx - array index
 * @return {object}
 */
function prepareVisDataItem($event, idx) {
  const { startdate, enddate } = $event.dataset

  const data = {
    id: idx,
    start: startdate,
    content: $event,
    active: false
  }

  if (enddate !== undefined && enddate != '') {
    data.end = enddate
  }

  return data
}

/**
 * Prepare data for vis-timeline as vis.DataSet
 *
 * @props {NodeList} $events - list of .timeline-event nodes
 * @return {vis.DataSet}
 */
function getVisDataFromEvents($events) {
  return new vis.DataSet(Array.from($events).map(prepareVisDataItem))
}

/**
 * Prepare data and initialize the vis-timeline instances
 */
$timelines.forEach(function($timeline) {
  const $events = $timeline.querySelectorAll(_eventSelector)
  $($timeline).append($visTimelineContainerMarkup)

  const $container = $timeline.querySelector(_visTimelineSelector)

  const data = getVisDataFromEvents($events)

  let zoomFactor = 2; // default: show 2 years
  if ($timeline.dataset?.timelineZoom !== '') {
    zoomFactor = parseInt($timeline.dataset.timelineZoom)
  }

  const { min, max } = getMinMaxDatesFromEvents($events)

  const options = {
    horizontalScroll: true,
    locale: 'de',
    selectable: false,
    showMajorLabels: true,
    showMinorLabels: false,
    showTooltips: false,
    stack: true,
    stackSubgroups: true,
    zoomable: false,
    zoomKey: 'ctrlKey',
    zoomMin: _yearInMs * zoomFactor,
    zoomMax: _yearInMs * zoomFactor,
    showCurrentTime: false,
    //align: 'left',
    limitSize: false,
    min: min,
    max: max,
  }

  const timeline = new vis.Timeline($container, data, options);
  visTimelines[$timeline.dataset.timelineId] = timeline

  const $background = $timeline.querySelector(_visBackgroundSelector)
  $($background).append($markerMarkup)
  const $marker = $timeline.querySelector(_markerSelector)
  const markerXleft = $marker.getBoundingClientRect().left
  const markerXright = $marker.getBoundingClientRect().right

  /**
   * Bind eventlisteners for items active state
   */
  timeline.on('changed', handleActiveStates)

  /**
   * Make sure to add/remove the 'active' class on the overflow container when it touches the $marker
   *
   * @prop {object} _event
   */
  function handleActiveStates(_event) {
    const $overflowItems = $timeline.querySelectorAll(_visOverflowSelector)

    $overflowItems.forEach(function($item) {
      const itemRect = $item.getBoundingClientRect()

      if (itemRect.left < markerXright && itemRect.right > markerXleft) {
        $($item).addClass(_activeClass)
      } else {
        $($item).removeClass(_activeClass)
      }
    })
  }

  timeline.on('rangechange', handleTimelineSync)

  /**
   * Handle synching of timelines
   *
   * This event handler takes a vis-timeline event, gets the target, computes the median of the
   * rendered time window and moves all the related timelines to this date.
   *
   * @prop {object} event
   */
  function handleTimelineSync(event) {
    /**
     * The idea of this pattern was to return a new handler for each timeline that does not run the
     * `timeline.setWindow()` method on the timeline that is currently being actively scrolled.
     */
    const $eventTarget = event.event?.target !== undefined ? event.event.target.closest(_timelineViewportSelector) : undefined
    const targetTimelineIds = $timeline.dataset.timelineSyncedWith.split(',')

    targetTimelineIds.forEach(function(targetTimelineId) {
      if ($eventTarget !== undefined && targetTimelineId !== $eventTarget.dataset.timelineId) {
        const start = event.start.getTime()
        const end = event.end.getTime()
        const median = Math.round((start + end) / 2)

        /**
         * Here we use the moveTo method and not the setWindow method, because the setWindow method
         * changes the zoom factor of the timeline by defining a start and end date for the rendered
         * time window. The moveTo method centers the timeline to the given date.
         */
        visTimelines[targetTimelineId].moveTo(median, {
          animation: {
            duration: 200,
            easingFunction: 'easeInOutQuad'
          }
        })
      }
    })
  }

  /**
   * Hide original track with JS, so it looks nice even if JS is disabled
   */
  const $track = $timeline.querySelector(_trackSelector)
  $track.style.display = 'none'; // hide original track
})

/**
  * Get min and max dates from timeline events
  *
  * @prop {object} $event - .timeline-event node
  */
function getMinMaxDatesFromEvents($events) {
  let min = new Date();
  let max = new Date(0);

  $events.forEach(function($event) {
    const startdate = new Date($event.dataset.startdate)
    if (startdate < min) {
      min = startdate
    }

    if ($event.dataset?.enddate !== '' && $event.dataset?.enddate !== undefined) {
      const enddate = new Date($event.dataset.enddate)

      if (enddate > max) {
        max = enddate
      }
    } else {
      if (startdate > max) {
        max = startdate
      }
    }
  })

  // Add one year of padding before and after first and last event
  min.setFullYear(min.getFullYear() - 1)
  max.setFullYear(max.getFullYear() + 1)

  return { min, max }
}
