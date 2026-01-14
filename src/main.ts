import MapNotesLayer from "@arcgis/core/layers/MapNotesLayer.js";
import PortalItem from "@arcgis/core/portal/PortalItem.js";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import TextSymbol from "@arcgis/core/symbols/TextSymbol.js";
import WebMap from "@arcgis/core/WebMap.js";
import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel.js";
import type {
  CreateEvent,
  UpdateEvent,
} from "@arcgis/core/widgets/Sketch/types";
import "@arcgis/map-components/components/arcgis-expand";
import "@arcgis/map-components/components/arcgis-layer-list";
import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@esri/calcite-components/components/calcite-action";
import "@esri/calcite-components/components/calcite-action-bar";
import "@esri/calcite-components/components/calcite-block";
import "@esri/calcite-components/components/calcite-button";
import "@esri/calcite-components/components/calcite-dialog";
import "@esri/calcite-components/components/calcite-input-text";
import "@esri/calcite-components/components/calcite-label";
import "@esri/calcite-components/components/calcite-link";
import "@esri/calcite-components/components/calcite-list";
import "@esri/calcite-components/components/calcite-list-item";
import "@esri/calcite-components/components/calcite-notice";
import "@esri/calcite-components/components/calcite-panel";
import "@esri/calcite-components/components/calcite-shell";
import "@esri/calcite-components/components/calcite-tooltip";
import "@esri/calcite-components/components/calcite-loader";
import "./style.css";

const attributeTitleInput = document.querySelector(
  "#attribute-title-input-text"
)! as HTMLCalciteInputTextElement;

const deleteAction = document.querySelector(
  "#delete-action"
)! as HTMLCalciteActionElement;

const drawActionBar = document.querySelector(
  "#draw-action-bar"
)! as HTMLCalciteActionBarElement;

const drawPointAction = document.querySelector(
  "#draw-point-action"
)! as HTMLCalciteActionElement;

const drawPolygonAction = document.querySelector(
  "#draw-polygon-action"
)! as HTMLCalciteActionElement;

const drawPolylineAction = document.querySelector(
  "#draw-polyline-action"
)! as HTMLCalciteActionElement;

const drawTextAction = document.querySelector(
  "#draw-text-action"
)! as HTMLCalciteActionElement;

const saveErrorMessage = document.querySelector(
  "#save-error-message"
)! as HTMLCalciteLinkElement;

const saveErrorNotice = document.querySelector(
  "#save-error-notice"
)! as HTMLCalciteNoticeElement;

const saveLoader = document.querySelector(
  "#save-loader"
)! as HTMLCalciteLoaderElement;

const saveResultsDialog = document.querySelector(
  "#save-results-dialog"
)! as HTMLCalciteDialogElement;

const saveSuccessLink = document.querySelector(
  "#save-success-link"
)! as HTMLCalciteLinkElement;

const saveSuccessNotice = document.querySelector(
  "#save-success-notice"
)! as HTMLCalciteNoticeElement;

const saveWebmapButton = document.querySelector(
  "#save-webmap"
)! as HTMLCalciteButtonElement;

const viewElement = document.querySelector(
  "arcgis-map"
)! as HTMLArcgisMapElement;

const webMapTitleInput = document.querySelector(
  "#webmap-title-input-text"
)! as HTMLCalciteInputTextElement;

let currentUpdatingSketchViewModel: SketchViewModel | null = null;

const mapNotesLayer = new MapNotesLayer();

const webMap = new WebMap({
  basemap: "gray-vector",
  layers: [mapNotesLayer],
});

viewElement.map = webMap;

const { pointLayer, polylineLayer, polygonLayer, textLayer } = mapNotesLayer;

const pointSketchViewModel = new SketchViewModel({
  view: viewElement.view,
  layer: pointLayer,
});

pointSketchViewModel.on("create", (event) => {
  createAttributes(drawPointAction, event);
});

pointSketchViewModel.on("update", (event) => {
  updateAttributes(pointSketchViewModel, event);
});

const polygonSketchViewModel = new SketchViewModel({
  view: viewElement.view,
  layer: polygonLayer,
});

polygonSketchViewModel.on("create", (event) => {
  createAttributes(drawPolygonAction, event);
});

polygonSketchViewModel.on("update", (event) => {
  updateAttributes(polygonSketchViewModel, event);
});

const polylineSketchViewModel = new SketchViewModel({
  view: viewElement.view,
  layer: polylineLayer,
});

polylineSketchViewModel.on("create", (event) => {
  createAttributes(drawPolylineAction, event);
});

polylineSketchViewModel.on("update", (event) => {
  updateAttributes(polylineSketchViewModel, event);
});

const textSketchViewModel = new SketchViewModel({
  view: viewElement.view,
  layer: textLayer,
});

textSketchViewModel.on("create", (event) => {
  createAttributes(drawTextAction, event);
});

textSketchViewModel.on("update", (event) => {
  updateAttributes(textSketchViewModel, event);
});

deleteAction.addEventListener("click", () => {
  resetActions();
  pointLayer?.removeAll();
  polylineLayer?.removeAll();
  polygonLayer?.removeAll();
  textLayer?.removeAll();
});

drawPointAction.addEventListener("click", () => {
  resetActions();
  drawPointAction.indicator = true;
  pointSketchViewModel.create("point", {
    graphicSymbol: new SimpleMarkerSymbol({
      style: "circle",
      size: 10,
      color: "#FFFFFF77",
      outline: new SimpleLineSymbol({
        color: "#0077B6FF",
        width: 2,
      }),
    }),
  });
});

drawPolygonAction.addEventListener("click", () => {
  resetActions();
  drawPolygonAction.indicator = true;
  polygonSketchViewModel.create("polygon", {
    graphicSymbol: new SimpleFillSymbol({
      color: "#43AA8B77",
      outline: new SimpleLineSymbol({
        color: "#0077B6FF",
        width: 2,
      }),
    }),
  });
});

drawPolylineAction.addEventListener("click", () => {
  resetActions();
  drawPolylineAction.indicator = true;
  polylineSketchViewModel.create("polyline", {
    graphicSymbol: new SimpleLineSymbol({
      color: "#F9A602FF",
      width: 4,
    }),
  });
});

drawTextAction.addEventListener("click", () => {
  resetActions();
  drawTextAction.indicator = true;
  textSketchViewModel.create("point", {
    graphicSymbol: new TextSymbol({
      color: "#F94144FF",
      font: {
        family: "Arial Unicode MS",
        size: 20,
      },
      haloColor: "#00000077",
      haloSize: 1,
      text: attributeTitleInput.value || "",
    }),
  });
});

attributeTitleInput.addEventListener("calciteInputTextChange", () => {
  if (currentUpdatingSketchViewModel) {
    currentUpdatingSketchViewModel.complete();
  }
});

saveResultsDialog.addEventListener("calciteDialogClose", () => {
  saveLoader.hidden = false;
  saveSuccessNotice.open = false;
  saveErrorNotice.open = false;
});

saveWebmapButton.addEventListener("click", async () => {
  console.log("Save webmap clicked");
  try {
    saveResultsDialog.open = true;

    const title = webMapTitleInput.value || "Map Notes Webmap";

    await webMap.updateFrom(viewElement.view);

    const portalItem = new PortalItem({
      title,
    });

    const saveAsResult = await webMap.saveAs(portalItem);

    saveSuccessLink.href = `${saveAsResult.portal.url}/home/item.html?id=${saveAsResult.id}`;
    saveSuccessLink.textContent = saveAsResult.title ?? "";
    saveLoader.hidden = true;
    saveSuccessNotice.open = true;
  } catch (error) {
    saveErrorMessage.textContent = (error as Error).message;
    saveLoader.hidden = true;
    saveErrorNotice.open = true;
  }
});

function createAttributes(
  action: HTMLCalciteActionElement,
  event: CreateEvent
) {
  if (event.state === "complete" && event.graphic) {
    event.graphic.attributes = {
      title: attributeTitleInput.value || "",
    };
    action.indicator = false;
  }
}

function resetActions() {
  drawActionBar.querySelectorAll("calcite-action").forEach((action) => {
    action.indicator = false;
  });
  pointSketchViewModel.cancel();
  polylineSketchViewModel.cancel();
  polygonSketchViewModel.cancel();
  textSketchViewModel.cancel();
}

function updateAttributes(
  sketchViewModel: SketchViewModel,
  event: UpdateEvent
) {
  if (event.state === "start") {
    attributeTitleInput.value = event.graphics[0].attributes?.title || "";
    currentUpdatingSketchViewModel = sketchViewModel;
  } else if (event.state === "complete") {
    event.graphics[0].attributes.title = attributeTitleInput.value || "";
    const symbol = event.graphics[0].symbol?.clone();
    if (symbol && symbol.type === "text") {
      symbol.text = attributeTitleInput.value || "";
      event.graphics[0].symbol = symbol;
    }
    attributeTitleInput.blur();
    currentUpdatingSketchViewModel = null;
  }
}
