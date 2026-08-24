const toggleFullScreen = () => {
  let doc = window.document;
  let docEl = doc.documentElement;

  let requestFullScreen =
    docEl.requestFullscreen ||
    docEl.mozRequestFullScreen ||
    docEl.webkitRequestFullScreen ||
    docEl.msRequestFullscreen;
  let cancelFullScreen =
    doc.exitFullscreen ||
    doc.mozCancelFullScreen ||
    doc.webkitExitFullscreen ||
    doc.msExitFullscreen;

  if (
    !doc.fullscreenElement &&
    !doc.mozFullScreenElement &&
    !doc.webkitFullscreenElement &&
    !doc.msFullscreenElement
  ) {
    requestFullScreen.call(docEl);
    return true;
  } else {
    cancelFullScreen.call(doc);
    return false;
  }
};

const apiHost = "http://api.covid19.et";
// const apiHost = "https://capi.abren.tech";
// const apiHost = "http://localhost:9017";

const downloadGeoJson = async axios => {
  try {
    // Cameroon 10 regions GeoJSON
    const result = await fetch(
      "/resources/cameroon_regions.json"
    );

    return await result.json();
  } catch (err) {
    console.log("unable to download geojson... ", err);
  }
};

const downloadGeoJsonMinimized = async axios => {
  try {
    // Cameroon regions (minimized version)
    const result = await fetch(
      "/resources/cameroon_regions.json"
    );
    return await result.json();
  } catch (err) {
    console.log("unable to download geojson... ", err);
  }
};

export default {
  apiHost,
  toggleFullScreen,
  downloadGeoJson,
  downloadGeoJsonMinimized
};
