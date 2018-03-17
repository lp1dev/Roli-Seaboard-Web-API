import { MIDIController } from './MIDI'

/** Synthetizers.js
 * A set of virtual synthetizers using various input types
 * https://en.wikipedia.org/wiki/Synthesizer
 */
const defaultSynthConf = {
  gain: 0,
  fadeTime: 0.2, // The fade in and out duration
  type: 'sine' // "sine", "square", "sawtooth" or "triangle"
}

/**
 * SubstractiveSynthetizer
 * The default Monophonic Sybstractive Synthetizer class
 * https://en.wikipedia.org/wiki/Subtractive_synthesis.
 * it interprets MIDI parsed messages through handleMessage and
 * plays sounds accordingly using its oscillators.
 * Flow : Oscillator => GainNode => Filter => AudioContext.destination
 */
class SubstractiveSynthetizer {
  constructor (name, filter, configuration = defaultSynthConf, audioContext = MIDIController.audioContext) {
    this.name = name
    this.configuration = configuration
    this.configuration.gain = this.configuration.gain || 0
    this.oscillators = {}
    this.gainNodes = {}
    this.notes = {}
    this.type = 'classic'
    this.audioContext = audioContext
  }
  handleMessage (message) {
    switch (message.type) {
      case 'Note ON':
        this.message = message
        if (!this.oscillators[message.channel]) {
          this.initOscillator(message.note, message.channel)
        }
        this.oscillators[message.channel].frequency.value = MIDIController.noteToFrequency(message.note)
        this.notes[message.channel] = message.note
        break
      case 'NOTE OFF':
        this.gainNodes[message.channel].gain.linearRampToValueAtTime(0, this.audioContext.currentTime + this.configuration.fadeTime)
        break
      case 'Channel Pressure (After-touch)':
        this.gainNodes[message.channel].gain.linearRampToValueAtTime(message.pressure / (128 + (this.configuration.gain || 0)),
        this.audioContext.currentTime + 0.1)
        break
      case 'Pitch Bend Change':
        const noteModulation = this.notes[message.channel] + message.pitchBend
        if (!isNaN(noteModulation)) {
          this.oscillators[message.channel].frequency.exponentialRampToValueAtTime(MIDIController.noteToFrequency(noteModulation), this.audioContext.currentTime + 0.1)
        }
        break
      case 'Control change':
        const filterFrequency = message.controlChange * 10
        this.filter.updateFrequency(filterFrequency)
        break
    }
  }
  initOscillator (note, channel) {
    const frequency = MIDIController.noteToFrequency(note)
    let gainNode = this.gainNodes[channel]
    let oscillator = this.oscillators[channel]
    if (!gainNode) {
      gainNode = this.audioContext.createGain()
      this.gainNodes[channel] = gainNode
      gainNode.gain.value = 0
      gainNode.connect(this.filter.biquadFilter)
    }
    if (!oscillator) {
      oscillator = this.audioContext.createOscillator()
      if (oscillator.type !== this.configuration.type) {
        oscillator.type = this.configuration.type
      }
      this.oscillators[channel] = oscillator
      oscillator.connect(gainNode)
      this.filter.connect(this.audioContext.destination)
    }
    oscillator.frequency.value = frequency
    oscillator.start()
  }
}

/**
 * CustomSynthetizer
 * The custom Synthetizer class, creates a new PeriodicWave instance and uses
 * it on each oscillator.
 * Ref: https://developer.mozilla.org/en-US/docs/Web/API/PeriodicWave
 */
class CustomSubstractiveSynthetizer extends SubstractiveSynthetizer {
  constructor (name, filter, configuration = defaultSynthConf, sin, cosin, disableNormalization = false) {
    super(name, filter, configuration)
    if (MIDIController.compatibleBrowser) {
      this.periodicWave = this.audioContext.createPeriodicWave(sin, cosin, {disableNormalization: disableNormalization})
    }
    this.sin = sin
    this.cosin = cosin
    this.custom = true
    this.amplitude = Math.max(...this.sin) || (Math.min(...this.sin) * -1)
    this.type = 'custom'
    this.filter = filter
  }
  initOscillator (note, channel) {
    const frequency = MIDIController.noteToFrequency(note)
    let gainNode = this.gainNodes[channel]
    let oscillator = this.oscillators[channel]
    if (!gainNode) {
      gainNode = this.audioContext.createGain()
      this.gainNodes[channel] = gainNode
      gainNode.gain.value = 0
      gainNode.connect(this.filter.biquadFilter)
    }
    if (!oscillator) {
      oscillator = this.audioContext.createOscillator()
      oscillator.setPeriodicWave(this.periodicWave)
      this.oscillators[channel] = oscillator
      oscillator.connect(gainNode)
      this.filter.connect(this.audioContext.destination)
    }
    oscillator.frequency.value = frequency
    oscillator.start()
  }
}

/**
 * FunctionSynthetizer
 * Another custom Synthetizer class, uses a function to
 * creates its new PeriodicWave (with {numSamples} samples)
 * Ref: https://developer.mozilla.org/en-US/docs/Web/API/PeriodicWave
 */
class FunctionSubstractiveSynthetizer extends CustomSubstractiveSynthetizer {
  constructor (name, filter, configuration = defaultSynthConf, funct, disableNormalization = false, numSamples = 12) {
    const sin = []
    const cos = new Int8Array(numSamples)
    sin[0] = 0
    for (let i = 1; i < numSamples; i++) {
      sin.push(funct(i))
    }
    super(name, filter, configuration, sin, cos, disableNormalization)
    this.function = funct
    this.type = 'function'
  }
}

export { SubstractiveSynthetizer, CustomSubstractiveSynthetizer, FunctionSubstractiveSynthetizer }
