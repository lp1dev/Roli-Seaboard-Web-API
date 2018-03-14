# Roli-Seaboard-Web-API

JavaScript (EcmaScript 6) API using the [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) and [Web MIDI](https://webaudio.github.io/web-midi-api/] APIs to interpret MIDI messages for a ROLI Seaboard controller.

### Files
    - js/**MIDI.js** : A set of Audio helpers to handle MIDI messages and play digital sounds
    - js/**Seaboard.js** : A class which, updated by the parsed messages from MIDI.js stores useful information on the Seaboard state and channels

### Examples

#### Example 1

Very basic usage example using Webpack. Displaying the developer-friendly formated Seaboard's status messages.

```
import Seaboard from './lib/Seaboard'
import { MIDIController } from './lib/MIDI'

MIDIController
  .getInputsByManufacturer('ROLI Ltd.')
  .then((MIDIInputs) => {
    console.log(MIDIInputs)
    if (!MIDIInputs.length) {
      console.error(`No ROLI device found.<br/>
      Please connect a Seaboard device using USB`)
      return
    }
    MIDIInputs.forEach((MIDIInput) => {
      const seaboard = new Seaboard(MIDIInput)
      seaboard.connect()
        .then(() => {
          seaboard.subscribeToMessages(displayParsedMIDIMessage)
        })
    })
  })
  .catch(error => console.error(error))

const displayParsedMIDIMessage = (message) => {
  document.body.innerHTML += `<pre>${JSON.stringify(message)}</pre>`
}
```

### More Examples

If you need more examples, please check my Seaboard-related projects here: [SeaboardHacks](https://github.com/lp1dev/SeaboardHacks).

## License
 
The MIT License (MIT)

Copyright (c) 2018 Jeremie Amsellem

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.