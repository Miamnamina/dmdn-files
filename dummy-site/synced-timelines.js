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
const _visTimelineClass = 'vis-timeline';
const _visTimelineSelector = '.' + _visTimelineClass;
const $visTimelineContainerMarkup = `<div class="${_visTimelineClass}"></div>`;
const _eventLineTimeSelector = '.event-line.time';
const _visOverflowSelector = '.vis-item-overflow';
const _visBackgroundSelector = '.vis-panel.vis-background';
const _markerClass = 'marker'
const _markerSelector = '.' + _markerClass;
const $markerMarkup = `<div class="${_markerClass}"></div>`;
const _activeClass = 'active';
const _timelineViewportSelector = '.timeline-viewport';

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

  if (enddate !== undefined) {
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
      const $dateLine = data.content.querySelector(_eventLineTimeSelector);

      if ($dateLine !== null) {
        $dateLine.innerText = data.start.toLocaleDateString() + ' - ' + data.end?.toLocaleDateString()
      }

      return data.content
    },
  }

  const timeline = new vis.Timeline($container, data, options);
  visTimelines[$timeline.dataset.timelineId] = timeline
  //console.log(timeline)

  const $background = $timeline.querySelector(_visBackgroundSelector)
  $($background).append($markerMarkup)
  const $marker = $timeline.querySelector(_markerSelector)
  const markerXleft = $marker.getBoundingClientRect().left
  const markerXright = $marker.getBoundingClientRect().right

  /**
   * Make sure to add/remove the 'active' class on the overflow container when it touches the $marker
   */
  function handleActiveStates(event) {
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
    const $eventTarget = event.event?.target !== undefined ? event.event.target.closest(_timelineViewportSelector) : undefined
    const targetTimelineIds = $timeline.dataset.timelineSyncedWith.split(',')

    targetTimelineIds.forEach(function(targetTimelineId) {
      if ($eventTarget !== undefined && targetTimelineId !== $eventTarget.dataset.timelineId) {
        const start = event.start.getTime()
        const end = event.end.getTime()
        const median = Math.round((start + end) / 2)

        visTimelines[targetTimelineIds].moveTo(median, {
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
