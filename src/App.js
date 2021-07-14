import './App.css';
import React, { useEffect, useRef } from 'react'
import soundUR from "./acssets/hey_sondn.mp3";
import { reject, resolve } from 'q';
import { stream } from 'stream';
import '@tensorflow/tfjs-backend-cpu'
import * as tf from '@tensorflow/tfjs'
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';
const mobilenet = require('@tensorflow-models/mobilenet')
const knnClassifier = require('@tensorflow-models/knn-classifier');
const { Howl } = require('howler')

var sound = new Howl({
  src: [soundUR]
});

const NOT_TOUCH = 'not_toich'
const TOUCHED = 'touched'
const TRAIN_TIME = 50

function App() {

  const video = useRef()
  const classifier = useRef()
  const mobilenetModul = useRef()
  const can = useRef(true)
  const init = async () => {

    await setupCamera()

    mobilenetModul.current = await mobilenet.load();

    classifier.current = knnClassifier.create();

    console.log('setup done')
    console.log('khong cham tay len mat va bam train 1')
  }

  const setupCamera = () => {
    return new Promise((resolve, reject) => {
      navigator.getUserMedia = navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia
      if (navigator.getUserMedia) {
        navigator.getUserMedia(
          {
            video: true
          },
          stream => {
            video.current.srcObject = stream
            video.current.addEventListener('loadeddata', resolve)
          },
          error => reject(error)
        )

      }
      else {
        reject()
      }
    })
  }
  const train = async label => {
    for (let i = 0; i < TRAIN_TIME; ++i) {
      console.log(i)
      await training(label)
    }

  }

  const training = label => {
    return new Promise(async resolve => {
      const embedding = mobilenetModul.current.infer(
        video.current,
        true
      )
      classifier.current.addExample(embedding, label)
      await sleep(100)
      resolve()
    })
  }

  const run = async () => {
    const embedding = mobilenetModul.current.infer(
      video.current,
      true
    )
    const result = await classifier.current.predictClass(embedding)
    console.log(result.label)
    console.log(result.confidences)
    if (result.label === TOUCHED && result.confidences[result.label] > 0.8) {
      console.log('cham')
      if (can.current) {
        can.current = false
        sound.play();
      }

    }
    else
      console.log('khong cham')
    await sleep(200)
    run()
  }

  const sleep = (ms = 0) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  useEffect(() => {
    init()
    sound.on('end', function () {
      can.current = true
    });
  }, [])
  return (
    <div className="main">
      <video
        ref={video}
        className='video'
        autoPlay
      />
      <div className='control'>
        <button className='btn' onClick={() => train(NOT_TOUCH)}>Train 1</button>
        <button className='btn' onClick={() => train(TOUCHED)}>Train 2</button>
        <button className='btn' onClick={() => run()}>Run</button>

      </div>
    </div>
  );
}

export default App;
