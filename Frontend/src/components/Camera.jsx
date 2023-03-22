import React, { useEffect, useState } from "react";
// import.meta.env.VITE_SOME_KEY;

function Camera({ email }) {
  const [source, setSource] = useState("");
  const BACKEND_API = import.meta.env.VITE_BACKEND_API;
  // The width and height of the captured photo. We will set the
  // width to the value defined here, but the height will be
  // calculated based on the aspect ratio of the input stream.

  const width = 520; // We will scale the photo width to this
  let height = 520; // This will be computed based on the input stream

  // |streaming| indicates whether or not we're currently streaming
  // video from the camera. Obviously, we start at false.

  let streaming = false;

  // The various HTML elements we need to configure or control. These
  // will be set by the startup() function.

  let video = null;
  let canvas = null;
  let photo = null;
  let startbutton = null;
  useEffect(() => {
    startup();
  }, []);

  function showViewLiveResultButton() {
    if (window.self !== window.top) {
      // Ensure that if our document is in a frame, we get the user
      // to first open it in its own tab or window. Otherwise, it
      // won't be able to request permission for camera access.
      document.querySelector(".contentarea").remove();
      const button = document.createElement("button");
      button.textContent = "View live result of the example code above";
      document.body.append(button);
      button.addEventListener("click", () => window.open(location.href));
      return true;
    }
    return false;
  }

  function startup() {
    // console.log("started video");
    if (showViewLiveResultButton()) {
      return;
    }
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    photo = document.getElementById("photo");
    startbutton = document.getElementById("startbutton");

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        video.srcObject = stream;
        video.play();
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (event) => {
          // const blob = event.data;

          takepicture();
        };
        //   To change frame rate
        recorder.start(500);
      })
      .catch((err) => {
        console.error(`An error occurred: ${err}`);
      });

    video.addEventListener(
      "canplay",
      (ev) => {
        if (!streaming) {
          height = video.videoHeight / (video.videoWidth / width);

          // Firefox currently has a bug where the height can't be read from
          // the video, so we will make assumptions if this happens.

          if (isNaN(height)) {
            height = width / (4 / 3);
          }

          video.setAttribute("width", width);
          video.setAttribute("height", height);
          canvas.setAttribute("width", width);
          canvas.setAttribute("height", height);
          streaming = true;
        }
      },
      false
    );

    // startbutton.addEventListener(
    //   "click",
    //   (ev) => {
    //     takepicture();
    //     ev.preventDefault();
    //   },
    //   false
    // );

    clearphoto();
  }

  // Fill the photo with an indication that none has been
  // captured.
  function clearphoto() {
    const context = canvas.getContext("2d");
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const data = canvas.toDataURL("image/png");
    // photo.setAttribute("src", data);
    // setSource(data);
  }

  // Capture a photo by fetching the current contents of the video
  // and drawing it into a canvas, then converting that to a PNG
  // format data URL. By drawing it on an offscreen canvas and then
  // drawing that to the screen, we can change its size and/or apply
  // other changes before drawing it.

  function takepicture() {
    const context = canvas.getContext("2d");
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);

      const data = canvas.toDataURL("image/png");
      let headers = new Headers();
      headers.append("Content-Type", "application/json");
      headers.append("Accept", "application/json");

      headers.append("Access-Control-Allow-Origin", `${BACKEND_API}`);
      headers.append("Access-Control-Allow-Credentials", "true");

      headers.append("GET", "POST", "OPTIONS");

      if (email !== undefined) {
        fetch(`${BACKEND_API}/receive/${email}`, {
          method: "POST",
          body: data,
          headers: headers,
        })
          .then((response) => response.json())
          .then((result) => {
            // console.log("Success:", result);
            setSource(result.image);
          })
          .catch((err) => {
            // console.log("Error:", error);
            // if (error.response.status === 500) {
            //   console.log("error 500");
            // }
            console.log(err);
          });
      }
      // console.log("API request sent");
      // console.log(data);
    } else {
      clearphoto();
    }
  }

  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener("load", startup, false);

  return (
    <div>
      <div>
        <video id="video" className="hidden">
          Video stream not available.
        </video>
      </div>
      <canvas id="canvas" className="hidden"></canvas>
      <img src={source} />
    </div>
  );
}

export default Camera;
