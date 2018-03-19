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
    this.channels = {}
    this.type = 'classic'
    this.audioContext = audioContext
  }
  handleMessage (message) {
    switch (message.type) {
      case 'Note ON':
        if (!this.channels[message.channel]) {
          this.initOscillator(message.note, message.channel)
        }
        this.message = message
        this.channels[message.channel]['oscillator'].frequency.value = MIDIController.noteToFrequency(message.note)
        this.channels[message.channel]['note'] = message.note
        break
      case 'Note OFF':
        this.channels[message.channel]['startingPosY'] = null
        this.filter.updateFrequency(this.filter.defaultFrequency)
        this.channels[message.channel]['gainNode'].gain.linearRampToValueAtTime(0, this.audioContext.currentTime + this.configuration.fadeTime)
        break
      case 'Channel Pressure (After-touch)':
        this.channels[message.channel]['gainNode'].gain.linearRampToValueAtTime(message.pressure / (128 + (this.configuration.gain || 0)),
        this.audioContext.currentTime + 0.1)
        break
      case 'Pitch Bend Change':
        if (this.channels[message.channel] && this.channels[message.channel]['note']) {
          const noteModulation = this.channels[message.channel]['note'] + message.pitchBend
          if (!isNaN(noteModulation)) {
            this.channels[message.channel]['oscillator'].frequency.exponentialRampToValueAtTime(MIDIController.noteToFrequency(noteModulation), this.audioContext.currentTime + 0.1)
          }
        }
        break
      case 'Control change':
        if (!this.channels[message.channel]) {
          break
        } else if (!this.channels[message.channel]['startingPosY']) {
          this.channels[message.channel]['startingPosY'] = message.controlChange
        } else {
          const frequencyVariation = (message.controlChange - this.channels[message.channel]['startingPosY'])
          this.filter.updateFrequency(this.filter.defaultFrequency + (frequencyVariation * 10))
        }
        break
    }
  }
  initOscillator (note, channel) {
    const frequency = MIDIController.noteToFrequency(note)
    this.channels[channel] = this.channels[channel] || {}
    let gainNode = this.channels[channel]['gainNode']
    let oscillator = this.channels[channel]['oscillator']
    if (!gainNode) {
      gainNode = this.audioContext.createGain()
      gainNode.gain.value = 0
      gainNode.connect(this.filter.biquadFilter)
      this.channels[channel]['gainNode'] = gainNode
    }
    if (!oscillator) {
      oscillator = this.audioContext.createOscillator()
      oscillator.type = this.configuration.type
      this.channels[channel]['oscillator'] = oscillator
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
    this.channels[channel] = this.channels[channel] || {}
    let gainNode = this.channels[channel]['gainNode']
    let oscillator = this.channels[channel]['oscillator']
    if (!gainNode) {
      gainNode = this.audioContext.createGain()
      gainNode.connect(this.filter.biquadFilter)
      gainNode.gain.value = 0
      this.channels[channel]['gainNode'] = gainNode
    }
    if (!oscillator) {
      oscillator = this.audioContext.createOscillator()
      oscillator.setPeriodicWave(this.periodicWave)
      oscillator.connect(gainNode)
      this.channels[channel]['oscillator'] = oscillator
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
