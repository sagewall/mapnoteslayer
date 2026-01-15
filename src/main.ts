import type GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import MapNotesLayer from "@arcgis/core/layers/MapNotesLayer.js";
import PortalItem from "@arcgis/core/portal/PortalItem.js";
import SimpleFillSymbol from "@arcgis/core/symbols/SimpleFillSymbol.js";
import SimpleLineSymbol from "@arcgis/core/symbols/SimpleLineSymbol.js";
import SimpleMarkerSymbol from "@arcgis/core/symbols/SimpleMarkerSymbol.js";
import TextSymbol from "@arcgis/core/symbols/TextSymbol.js";
import type MapView from "@arcgis/core/views/MapView.js";
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
import "@esri/calcite-components/components/calcite-loader";
import "@esri/calcite-components/components/calcite-notice";
import "@esri/calcite-components/components/calcite-panel";
import "@esri/calcite-components/components/calcite-shell";
import "@esri/calcite-components/components/calcite-tooltip";
import "./style.css";

// Input element for the title attribute for the map note graphic.
const attributeTitleInput = document.querySelector(
  "#attribute-title-input-text"
)! as HTMLCalciteInputTextElement;

// Action element for deleting all map note graphics.
const deleteAction = document.querySelector(
  "#delete-action"
)! as HTMLCalciteActionElement;

// Action bar element for drawing map note graphics.
const drawActionBar = document.querySelector(
  "#draw-action-bar"
)! as HTMLCalciteActionBarElement;

// Action element for drawing point map note graphics.
const drawPointAction = document.querySelector(
  "#draw-point-action"
)! as HTMLCalciteActionElement;

// Action element for drawing polygon map note graphics.
const drawPolygonAction = document.querySelector(
  "#draw-polygon-action"
)! as HTMLCalciteActionElement;

// Action element for drawing polyline map note graphics.
const drawPolylineAction = document.querySelector(
  "#draw-polyline-action"
)! as HTMLCalciteActionElement;

// Action element for drawing text map note graphics.
const drawTextAction = document.querySelector(
  "#draw-text-action"
)! as HTMLCalciteActionElement;

// Div element for displaying save error messages.
const saveErrorMessage = document.querySelector(
  "#save-error-message"
)! as HTMLDivElement;

// Notice element for displaying save error messages.
const saveErrorNotice = document.querySelector(
  "#save-error-notice"
)! as HTMLCalciteNoticeElement;

// Loader element for displaying save progress.
const saveLoader = document.querySelector(
  "#save-loader"
)! as HTMLCalciteLoaderElement;

// Dialog element for displaying save results.
const saveResultsDialog = document.querySelector(
  "#save-results-dialog"
)! as HTMLCalciteDialogElement;

// Link element for displaying a link to the saved web map.
const saveSuccessLink = document.querySelector(
  "#save-success-link"
)! as HTMLCalciteLinkElement;

// Notice element for displaying save success messages.
const saveSuccessNotice = document.querySelector(
  "#save-success-notice"
)! as HTMLCalciteNoticeElement;

// Button element for saving the web map.
const saveWebmapButton = document.querySelector(
  "#save-webmap"
)! as HTMLCalciteButtonElement;

// Map element for displaying the map.
const viewElement = document.querySelector(
  "arcgis-map"
)! as HTMLArcgisMapElement;

// Input element for the title of the web map.
const webMapTitleInput = document.querySelector(
  "#webmap-title-input-text"
)! as HTMLCalciteInputTextElement;

// Current updating SketchViewModel.
let currentUpdatingSketchViewModel: SketchViewModel | null = null;

// Map notes layer for storing map note graphics.
const mapNotesLayer = new MapNotesLayer();

// Web map for displaying the map notes layer.
const webMap = new WebMap({
  basemap: "gray-vector",
  layers: [mapNotesLayer],
});

// Set the web map on the view element.
viewElement.map = webMap;

// Destructure the individual layers from the map notes layer.
const { pointLayer, polylineLayer, polygonLayer, textLayer } = mapNotesLayer;

// Create SketchViewModels for each geometry type using the
// createSketchViewModel factory function.
const pointSketchViewModel = createSketchViewModel({
  view: viewElement.view,
  layer: pointLayer,
  action: drawPointAction,
});
const polygonSketchViewModel = createSketchViewModel({
  view: viewElement.view,
  layer: polygonLayer,
  action: drawPolygonAction,
});
const polylineSketchViewModel = createSketchViewModel({
  view: viewElement.view,
  layer: polylineLayer,
  action: drawPolylineAction,
});
const textSketchViewModel = createSketchViewModel({
  view: viewElement.view,
  layer: textLayer,
  action: drawTextAction,
});

// Event listener for deleting all map note graphics.
deleteAction.addEventListener("click", () => {
  resetActions();
  pointLayer?.removeAll();
  polylineLayer?.removeAll();
  polygonLayer?.removeAll();
  textLayer?.removeAll();
});

// Event listener for drawing point map note graphics.
drawPointAction.addEventListener("click", () => {
  // Reset all drawing actions.
  resetActions();
  // Set the indicator for the draw point action.
  drawPointAction.indicator = true;
  // Create a new point graphic with a simple marker symbol.
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

// Event listener for drawing polygon map note graphics.
drawPolygonAction.addEventListener("click", () => {
  // Reset all drawing actions.
  resetActions();
  // Set the indicator for the draw polygon action.
  drawPolygonAction.indicator = true;
  // Create a new polygon graphic with a simple fill symbol.
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

// Event listener for drawing polyline map note graphics.
drawPolylineAction.addEventListener("click", () => {
  // Reset all drawing actions.
  resetActions();
  // Set the indicator for the draw polyline action.
  drawPolylineAction.indicator = true;
  // Create a new polyline graphic with a simple line symbol.
  polylineSketchViewModel.create("polyline", {
    graphicSymbol: new SimpleLineSymbol({
      color: "#F9A602FF",
      width: 4,
    }),
  });
});

// Event listener for drawing text map note graphics.
drawTextAction.addEventListener("click", () => {
  // Reset all drawing actions.
  resetActions();
  // Set the indicator for the draw text action.
  drawTextAction.indicator = true;
  // Create a new graphic with a text symbol.
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

// Event listener for updating the graphic title attributes
// when the input value changes.
attributeTitleInput.addEventListener("calciteInputTextChange", () => {
  if (currentUpdatingSketchViewModel) {
    currentUpdatingSketchViewModel.complete();
  }
});

// Event listener for closing the save results dialog.
saveResultsDialog.addEventListener("calciteDialogClose", () => {
  saveLoader.hidden = false;
  saveSuccessNotice.open = false;
  saveErrorNotice.open = false;
});

// Event listener for saving the webmap.
saveWebmapButton.addEventListener("click", async () => {
  try {
    // Open the save results dialog.
    saveResultsDialog.open = true;

    // Get the webmap title from the input field.
    const title = webMapTitleInput.value || "Map Notes Webmap";

    // Update the webmap with the current view.
    await webMap.updateFrom(viewElement.view);

    // Create a new portal item with the webmap title.
    const portalItem = new PortalItem({
      title,
    });

    // Save the webmap as a new portal item.
    const saveAsResult = await webMap.saveAs(portalItem);

    // Update the save success link with the new portal item URL.
    saveSuccessLink.href = `${saveAsResult.portal.url}/home/item.html?id=${saveAsResult.id}`;
    saveSuccessLink.textContent = saveAsResult.title ?? "";
    saveLoader.hidden = true;
    saveSuccessNotice.open = true;
  } catch (error) {
    // Display the error message if the webmap save fails.
    saveErrorMessage.textContent = (error as Error).message;
    saveLoader.hidden = true;
    saveErrorNotice.open = true;
  }
});

// Function for creating attributes for a new graphic.
function createAttributes(
  action: HTMLCalciteActionElement,
  event: CreateEvent
) {
  // Create attributes for the new graphic when the creation is complete.
  if (event.state === "complete" && event.graphic) {
    event.graphic.attributes = {
      title: attributeTitleInput.value || "",
    };
    // Reset the action indicator when the creation is complete.
    action.indicator = false;
  }
}

// Function to create a SketchViewModel and set up event listeners.
function createSketchViewModel(options: {
  view: MapView;
  layer: GraphicsLayer | null | undefined;
  action: HTMLCalciteActionElement;
}) {
  const sketchViewModel = new SketchViewModel({
    view: options.view,
    layer: options.layer,
  });
  sketchViewModel.on("create", (event) => {
    createAttributes(options.action, event);
  });
  sketchViewModel.on("update", (event) => {
    updateAttributes(sketchViewModel, event);
  });
  return sketchViewModel;
}

// Function for resetting all drawing actions.
function resetActions() {
  // Set all action indicators to false.
  drawActionBar.querySelectorAll("calcite-action").forEach((action) => {
    action.indicator = false;
  });
  // Cancel all active sketch view models.
  pointSketchViewModel.cancel();
  polylineSketchViewModel.cancel();
  polygonSketchViewModel.cancel();
  textSketchViewModel.cancel();
}

// Function for updating the attributes of an existing graphic.
function updateAttributes(
  sketchViewModel: SketchViewModel,
  event: UpdateEvent
) {
  if (event.state === "start") {
    // When the update starts, populate the input with the current graphic title.
    attributeTitleInput.value = event.graphics[0].attributes?.title || "";
    // Set the current updating sketch view model when the update starts.
    currentUpdatingSketchViewModel = sketchViewModel;
  } else if (event.state === "complete") {
    // When the update is complete, update the graphic title attribute.
    event.graphics[0].attributes.title = attributeTitleInput.value || "";
    // Clone the current symbol and update the text if it's a text symbol.
    const symbol = event.graphics[0].symbol?.clone();
    if (symbol && symbol.type === "text") {
      symbol.text = attributeTitleInput.value || "";
      event.graphics[0].symbol = symbol;
    }
    // Blur the input so it loses focus.
    attributeTitleInput.blur();
    // Clear the current updating sketch view model.
    currentUpdatingSketchViewModel = null;
  }
}
