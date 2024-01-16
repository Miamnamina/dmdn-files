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

/**
 * Figure out whether events overlap and put them into different lanes.
 *
 * This always prepares a first lane and adds other lanes on demand.
 */
$timelines.forEach(function($timeline) {
  // TODO: create a function for this
  const $events = $timeline.querySelectorAll(_eventSelector)
  $($events).wrapAll('<div class="timeline-lane"></div>')

  $($timeline).append('<div class="vis-timeline"></div>')

  const $container = $timeline.querySelector('.vis-timeline')

  console.log($events)

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
        content: $event
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
    min: minimumDate,
    max: maximumDate,
    showCurrentTime: false,
    template: function(item, element, data) {
      console.log(data)

      const $dateLine = data.content.querySelector('.event-line.time');

      if ($dateLine !== null) {
        $dateLine.innerText = data.start.toLocaleDateString() + ' - ' + data.end?.toLocaleDateString()
      }

      return data.content
    }
  };

  const timeline = new vis.Timeline($container, data, options);
  /*  $events.forEach(function($event) {
      if ($event.dataset.startdate !== undefined) {
        $event.dataset.startdateUnix = dateToUnixTimestamp(new Date($event.dataset.startdate))
      }
      if ($event.dataset.enddate !== undefined) {
        $event.dataset.enddateUnix = dateToUnixTimestamp(new Date($event.dataset.enddate))
      }
    }) */

  //sortEvents($events);
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
      if ($syncedTimeline.dataset.timelineId !== $timeline.dataset.timelineId) {
        $syncedTrack.scrollTo({ left: scrollTo })
      }
    })
  });
})

/**
 * Functions section
 */
function sortEvents($events) {
  sortEventsIntoTracks($events)
}

function dateToUnixTimestamp(date) {
  return Math.floor(date / 1000)
}

/**
  * Custom "sort" function to determine whether events start before or after oneanother
  */
function compareEvents(starttimeUnixA, starttimeUnixB) {
  if (starttimeUnixA < starttimeUnixB) {
    return -1; // Event A starts before event B
  } else if (starttimeUnixA > starttimeUnixB) {
    return 1; // Event A starts after event B
  } else {
    return 0; // Events start at the same time
  }
}

/**
  * Figure out whether events overlap or not
  */
function doEventsOverlap($eventA, $eventB) {
  return (
    $eventA.dataset.starttimeUnix < $eventB.dataset.endtimeUnix && // Event A starts before event B ends
    $eventA.dataset.endtimeUnix > $eventB.dataset.starttimeUnix   // event A ends after event B starts
  );
}

function sortEventsIntoTracks($events) {
  const $lanes = [];

  // Iterate through each event in the input array
  for (let i = 0; i < $events.length; i++) {
    let $currentEvent = $events[i];
    let $nextEvent = $events[i + 1];

    // if current event overlaps with the next one, put the next one on a new track
    // if it then overlaps with the last element of that lane, put it on yet another track
    // if the current element is on a lane other than 0 try to put the element into the previous lane (e.g. element on lane 1 overlaps with next one, so maybe put the next element back to lane 0)
    // That way we only need to look at 3 elements at a time, the current, the next and the last one from the other lanes

    if (i === 0) {
      $currentEvent.dataset.lane = 0;

      $lanes[0] = [];
      $lanes[0].push($currentEvent);
    }

    if ($nextEvent !== undefined && doEventsOverlap($currentEvent, $nextEvent)) {
      $nextEvent.dataset.lane = 1;

      if ($lanes[1] === undefined) $lanes[1] = []
      $lanes[1].push($nextEvent)
    } else {
      $nextEvent.dataset.lane = 0;

      $lanes[0].push($nextEvent)
    }
  }
}
