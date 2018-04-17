/** Filters.js
 * A set of virtual audio filters
 * https://en.wikipedia.org/wiki/Audio_filter
 */

import { MIDIController } from './MIDI'

/**
 * Filter
 * The default biquad filter
 * types: 'lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass'
 */
class Filter {
  constructor (type, frequency, gain, q, audioContext = MIDIController.audioContext) {
    this.type = type
    this.name = type
    this.frequency = frequency
    this.defaultFrequency = frequency
    this.gain = gain
    this.maxGain = 100
    this.types = FilterTypes
    this.q = q
    this.audioContext = audioContext
    this.initBiquadFilter()
  }
  initBiquadFilter () {
    this.biquadFilter = this.audioContext.createBiquadFilter()
    this.biquadFilter.type = this.type
    this.biquadFilter.frequency.value = this.frequency
    this.biquadFilter.Q.value = this.q
    this.biquadFilter.gain.value = this.gain
  }
  connect (destination) {
    this.biquadFilter.connect(destination)
  }
  updateType (value) {
    if (value) {
      this.type = value
    }
    this.biquadFilter.type = this.type
  }
  updateGain (value) {
    if (value) {
      if (value > this.maxGain) {
        value = this.maxGain
      }
      this.gain = value
    }
    this.biquadFilter.gain.value = this.gain
  }
  updateFrequency (value) {
    if (value) {
      this.frequency = value
    }
    this.biquadFilter.frequency.value = this.frequency
  }
  updateQ (value) {
    if (value) {
      this.q = value
    }
    this.biquadFilter.Q.value = this.q
  }
}

const FilterTypes = ['lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass']

export { Filter, FilterTypes }
