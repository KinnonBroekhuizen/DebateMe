let audioCtx, analyser, audioBuffer;

async function loadAudio() {
    audioCtx = new AudioContext();

    const response = await fetch('http://localhost:8000/speak', { //The localhost will be replaced once we have railway setup.
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "Your debate speech here" })
    });

    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    play();
}


function play() {
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    source.start();

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const img = document.getElementById('trump');

    function tick() {
        analyser.getByteFrequencyData(dataArray);

        // Average the voice frequencies into one loudness number
        const avg = dataArray.slice(2, 18).reduce((a, b) => a + b) / 16;

        // If loud enough, show open mouth — otherwise closed
        img.src = avg > 150 ? 'PoliticianExpressions/Mouth-Open-Trump.png' : 'PoliticianExpressions/Mouth-Closed-Trump.png';

        requestAnimationFrame(tick);
    }

    tick();

    source.onended = () => img.src = 'PoliticianExpressions/Mouth-Closed-Trump.png';
}

loadAudio();

//Just keep in mind in the front end, you will need to have a method that calls the javascript,
//and an original image file. For Example :

//<button onclick="loadAudio()">Play</button>
//<img id="trump" src="Mouth-Closed-Trump.png" width="300"/>
//<script src="speechanimation.js"></script>
