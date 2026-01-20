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

// -----------------------------------------------------------------------
// Application State
// -----------------------------------------------------------------------

const state = {
  // Tracks the sequential number used to generate unique default titles for new map notes.
  currentMapNoteNumber: 0,
  // Holds a reference to the SketchViewModel currently being edited,
  // used for attribute synchronization and UI state management.
  activeSketchViewModel: null as SketchViewModel | null,
};

// -----------------------------------------------------------------------
// HTML Element References
// -----------------------------------------------------------------------

// Panel UI element that allows users to view and edit the title
// of the currently selected map note graphic.
const attributePanel = document.querySelector(
  "#attribute-panel",
)! as HTMLCalcitePanelElement;

// Text input field where users can enter or edit the title of the selected map note graphic.
const attributeTitleInput = document.querySelector(
  "#attribute-title-input-text",
)! as HTMLCalciteInputTextElement;

// Action button that initiates the process to delete all map note graphics from the map,
// prompting user confirmation.
const deleteAction = document.querySelector(
  "#delete-action",
)! as HTMLCalciteActionElement;

// Button that, when clicked, confirms the user's intent to delete all map note graphics
// and executes the deletion action.
const deleteConfirmButton = document.querySelector(
  "#delete-confirm-button",
)! as HTMLCalciteButtonElement;

// Button that allows the user to cancel the deletion process and keep all existing map note graphics.
const deleteCancelButton = document.querySelector(
  "#delete-cancel-button",
)! as HTMLCalciteButtonElement;

// Dialog window that prompts the user to confirm or cancel the deletion of all map note graphics,
// ensuring intentional action.
const deleteDialog = document.querySelector(
  "#delete-dialog",
)! as HTMLCalciteDialogElement;

// Toolbar containing drawing actions for creating new map note graphics
// of various types (point, line, polygon, text).
const drawActionBar = document.querySelector(
  "#draw-action-bar",
)! as HTMLCalciteActionBarElement;

// UI control (action button) that enables users to start drawing a new point map note graphic on the map.
const drawPointAction = document.querySelector(
  "#draw-point-action",
)! as HTMLCalciteActionElement;

// UI control (action button) that enables users to start drawing a new polygon map note graphic on the map.
const drawPolygonAction = document.querySelector(
  "#draw-polygon-action",
)! as HTMLCalciteActionElement;

// UI control (action button) that enables users to start drawing a new polyline map note graphic on the map.
const drawPolylineAction = document.querySelector(
  "#draw-polyline-action",
)! as HTMLCalciteActionElement;

// UI control (action button) that enables users to start drawing a new text map note graphic on the map.
const drawTextAction = document.querySelector(
  "#draw-text-action",
)! as HTMLCalciteActionElement;

// Container (div) for displaying detailed error messages to the user when saving the web map fails.
const saveErrorMessage = document.querySelector(
  "#save-error-message",
)! as HTMLDivElement;

// Visual alert (notice) that informs the user when an error occurs during the web map save process.
const saveErrorNotice = document.querySelector(
  "#save-error-notice",
)! as HTMLCalciteNoticeElement;

// Visual loading indicator that shows the user when the web map is being saved or processed.
const saveLoader = document.querySelector(
  "#save-loader",
)! as HTMLCalciteLoaderElement;

// Dialog window that communicates the outcome of the web map save operation,
// showing success or error details to the user.
const saveResultsDialog = document.querySelector(
  "#save-results-dialog",
)! as HTMLCalciteDialogElement;

// Direct link that allows the user to access and view the newly saved web map
// after a successful save operation.
const saveSuccessLink = document.querySelector(
  "#save-success-link",
)! as HTMLCalciteLinkElement;

// Visual alert (notice) that informs the user when the web map has been saved successfully.
const saveSuccessNotice = document.querySelector(
  "#save-success-notice",
)! as HTMLCalciteNoticeElement;

// Button that initiates the process of saving the current web map,
// including user-drawn map notes, to the portal.
const saveWebMapButton = document.querySelector(
  "#save-webmap",
)! as HTMLCalciteButtonElement;

// Action button that enables users to select existing map note graphics on the map
// for editing or updating their attributes.
const selectAction = document.querySelector(
  "#select-action",
)! as HTMLCalciteActionElement;

// Main interactive map container that displays the web map and all user-created map note graphics.
const viewElement = document.querySelector(
  "arcgis-map",
)! as HTMLArcgisMapElement;

// Text input field where users specify or edit the title for the web map before saving it to the portal.
const webMapTitleInput = document.querySelector(
  "#webmap-title-input-text",
)! as HTMLCalciteInputTextElement;

// -----------------------------------------------------------------------
// MapNotesLayer and Map Setup
// -----------------------------------------------------------------------

// Dedicated layer for storing and managing all user-created map note graphics—including
// points, lines, polygons, and text—on the map.
const mapNotesLayer = new MapNotesLayer();

// Extract individual sublayers for points, polylines, polygons, and text from the MapNotesLayer
// for direct access and management.
const { pointLayer, polylineLayer, polygonLayer, textLayer } = mapNotesLayer;

// Instantiate the main WebMap, configured with a gray vector basemap and the MapNotesLayer
// as its operational layer for displaying user notes.
const webMap = new WebMap({
  basemap: "gray-vector",
  layers: [mapNotesLayer],
});

// Assign the configured WebMap to the map view element,
// making it visible and interactive in the application UI.
viewElement.map = webMap;

// -----------------------------------------------------------------------
// SketchViewModels
// -----------------------------------------------------------------------

// Instantiate a dedicated SketchViewModel for each geometry type (point, polyline, polygon, text),
// enabling independent drawing and editing workflows tailored to each map note type.
// The createSketchViewModel factory function encapsulates event handling and UI integration
// for modularity and maintainability.
const pointSketchViewModel = createSketchViewModel({
  action: drawPointAction,
  layer: pointLayer,
  view: viewElement.view,
});
const polygonSketchViewModel = createSketchViewModel({
  action: drawPolygonAction,
  layer: polygonLayer,
  view: viewElement.view,
});
const polylineSketchViewModel = createSketchViewModel({
  action: drawPolylineAction,
  layer: polylineLayer,
  view: viewElement.view,
});
const textSketchViewModel = createSketchViewModel({
  action: drawTextAction,
  layer: textLayer,
  view: viewElement.view,
});

// -----------------------------------------------------------------------
// Event Listeners
// -----------------------------------------------------------------------

// Event listener that synchronizes the title input field with the selected map note
// graphic's title attribute whenever the user modifies the input value.
attributeTitleInput.addEventListener("calciteInputTextChange", () => {
  if (state.activeSketchViewModel) {
    state.activeSketchViewModel.complete();
  }
});

// Event listener that initiates the deletion workflow, prompting the user to confirm before
// removing all map note graphics from the map.
deleteAction.addEventListener("click", () => {
  deleteAction.indicator = true;
  deleteDialog.open = true;
});

// Event listener that executes the deletion of all map note graphics after user confirmation,
// then resets the UI state.
deleteConfirmButton.addEventListener("click", () => {
  pointLayer?.removeAll();
  polylineLayer?.removeAll();
  polygonLayer?.removeAll();
  textLayer?.removeAll();
  deleteDialog.open = false;
  resetActions();
});

// Event listener that aborts the deletion workflow, closes the confirmation dialog,
// and restores the UI to its previous state.
deleteCancelButton.addEventListener("click", () => {
  deleteDialog.open = false;
  resetActions();
});

// Event listener that initializes the workflow for creating a new point map note graphic,
// including UI updates and drawing activation.
drawPointAction.addEventListener("click", () => {
  // Prepare the application for creating a new map note by clearing active tools,
  // disabling editing of existing graphics, and incrementing the note counter
  // to assign a unique default title.
  initializeNewMapNote();

  // Display the attribute panel to prompt the user to enter a title and
  // details for the new map note graphic.
  attributePanel.hidden = false;

  // Visually activate the draw point action to indicate to the user that the
  // point drawing tool is currently selected.
  drawPointAction.indicator = true;

  // Begin the drawing interaction by creating a new point graphic on the map,
  // using a visually distinct circular simple marker symbol.
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

// Event listener that initiates the workflow for creating a new polygon map note graphic,
// including UI updates and drawing tool activation.
drawPolygonAction.addEventListener("click", () => {
  // Prepare the application for creating a new polygon map note by clearing active tools,
  // disabling editing of existing graphics, and incrementing the note counter
  // to assign a unique default title.
  initializeNewMapNote();

  // Display the attribute panel to prompt the user to enter a title and
  // details for the new map note graphic.
  attributePanel.hidden = false;

  // Visually activate the draw polygon action to indicate to the user that the
  // polygon drawing tool is currently selected.
  drawPolygonAction.indicator = true;

  // Begin the drawing interaction by creating a new polygon graphic on the map,
  // using a visually distinct simple fill symbol and outline.
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

// Event listener that initiates the workflow for creating a new polyline map note graphic,
// including UI updates and drawing tool activation.
drawPolylineAction.addEventListener("click", () => {
  // Prepare the application for creating a new polyline map note by clearing active tools,
  // disabling editing of existing graphics, and incrementing the note counter
  // to assign a unique default title.
  initializeNewMapNote();

  // Display the attribute panel to prompt the user to enter a title and
  // details for the new map note graphic.
  attributePanel.hidden = false;

  // Visually activate the draw polyline action to indicate to the user that the
  // polyline drawing tool is currently selected.
  drawPolylineAction.indicator = true;

  // Begin the drawing interaction by creating a new polyline graphic on the map,
  // using a visually distinct simple line symbol.
  polylineSketchViewModel.create("polyline", {
    graphicSymbol: new SimpleLineSymbol({
      color: "#F9A602FF",
      width: 4,
    }),
  });
});

// Event listener that initiates the workflow for creating a new text map note graphic,
// including UI updates and drawing tool activation.
drawTextAction.addEventListener("click", () => {
  // Prepare the application for creating a new text map note by clearing active tools,
  // disabling editing of existing graphics, and incrementing the note counter
  // to assign a unique default title.
  initializeNewMapNote();

  // Display the attribute panel to prompt the user to enter a title and
  // details for the new map note graphic.
  attributePanel.hidden = false;

  // Visually activate the draw text action to indicate to the user that the
  // text drawing tool is currently selected.
  drawTextAction.indicator = true;

  // Begin the drawing interaction by creating a new text graphic on the map,
  // using a visually distinct text symbol.
  textSketchViewModel.create("point", {
    graphicSymbol: new TextSymbol({
      color: "#F94144FF",
      font: {
        family: "Arial Unicode MS",
        size: 20,
      },
      haloColor: "#00000077",
      haloSize: 1,
    }),
  });
});

// Event listener that resets the UI state when the save results dialog is closed,
// preparing the application for further user actions.
saveResultsDialog.addEventListener("calciteDialogClose", () => {
  saveLoader.hidden = false;
  saveSuccessNotice.open = false;
  saveErrorNotice.open = false;
});

// Event listener that handles the workflow for saving the current WebMap,
// including UI feedback for success or error states.
saveWebMapButton.addEventListener("click", async () => {
  try {
    // Open the dialog that displays the outcome of the web map save operation,
    // providing feedback on success or failure.
    saveResultsDialog.open = true;

    // Retrieve the user-provided title for the WebMap from the input field,
    // or use a default title if none is specified.
    const title = webMapTitleInput.value || "Map Notes WebMap";

    // Synchronize the WebMap's state with the current map view, ensuring all user changes and
    // map notes are included before saving.
    await webMap.updateFrom(viewElement.view);

    // Create a new PortalItem instance representing the WebMap, including its title and description,
    // to prepare it for saving to the portal.
    const portalItem = new PortalItem({
      description:
        "WebMap created with the ArcGIS Maps SDK for JavaScript MapNotesLayer sample.",
      title,
    });

    // Save the current WebMap as a new PortalItem in the user's portal,
    // making it accessible and shareable online.
    const saveAsResult = await webMap.saveAs(portalItem);

    // Update the success link to provide direct access to the newly saved WebMap,
    // setting its URL and display title from the new PortalItem.
    saveSuccessLink.href = `${saveAsResult.portal.url}/home/item.html?id=${saveAsResult.id}`;
    saveSuccessLink.textContent = saveAsResult.title ?? "";

    // Hide the loading indicator and display a success notice to inform the user
    // that the WebMap was saved successfully.
    saveLoader.hidden = true;
    saveSuccessNotice.open = true;
  } catch (error) {
    // Display a detailed error message and visual feedback if the WebMap save operation fails,
    // helping the user understand what went wrong.
    saveErrorMessage.textContent = (error as Error).message;
    saveLoader.hidden = true;
    saveErrorNotice.open = true;
  }
});

// Event listener that manages the workflow for selecting existing map note graphics and
// enabling their attribute updates, including toggling between selection and editing modes.
selectAction.addEventListener("click", () => {
  // If the select action is already active, reset all UI actions and
  // disable editing mode to exit selection.
  if (selectAction.indicator) {
    resetActions();
    disableUpdates();
    return;
  }
  // Otherwise, reset all UI actions and enable editing mode, allowing the user to select and
  // update map note graphics.
  resetActions();
  selectAction.indicator = true;
  allowUpdates();
});

// -----------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------

// Enables update mode on all SketchViewModels, allowing users to select and edit
// any map note graphic by clicking on it.
function allowUpdates() {
  pointSketchViewModel.updateOnGraphicClick = true;
  polylineSketchViewModel.updateOnGraphicClick = true;
  polygonSketchViewModel.updateOnGraphicClick = true;
  textSketchViewModel.updateOnGraphicClick = true;
}

// Sets initial attributes, popup template, and symbol properties
// for a newly created map note graphic based on user input.
function createAttributes(
  action: HTMLCalciteActionElement,
  event: CreateEvent,
) {
  // Only proceed if the graphic creation event has finished and a new graphic exists.
  if (event.state === "complete" && event.graphic) {
    // Clone the current symbol and update the text if it's a text symbol.
    const symbol = event.graphic.symbol?.clone();
    if (symbol && symbol.type === "text" && event.graphic) {
      symbol.text = attributeTitleInput.value || "";
      event.graphic.symbol = symbol;
    }

    // Assign the user-provided title as an attribute on the new graphic.
    event.graphic.attributes = {
      title: attributeTitleInput.value || "",
    };

    // Configure the popup to display the graphic's title when clicked.
    event.graphic.popupTemplate = {
      title: "{title}",
    };

    // Reset the action's visual indicator and close the attribute editing panel.
    action.indicator = false;
    attributePanel.hidden = true;

    // Enable all drawing actions so the user can create or edit additional map notes.
    drawActionBar.querySelectorAll("calcite-action").forEach((action) => {
      action.disabled = false;
    });
  }
}

// Factory function to initialize a SketchViewModel for a specific geometry type,
// wiring up creation and update event handlers for map note graphics.
function createSketchViewModel(options: {
  action: HTMLCalciteActionElement;
  layer: GraphicsLayer | null | undefined;
  view: MapView;
}) {
  // Instantiate a SketchViewModel for the specified layer and view,
  // disabling update-on-click by default.
  const sketchViewModel = new SketchViewModel({
    view: options.view,
    layer: options.layer,
    updateOnGraphicClick: false,
  });

  // Attach handlers for create and update events to manage drawing and editing workflows.
  sketchViewModel.on("create", (event) => {
    // Temporarily disable all drawing actions to prevent user interaction during graphic creation.
    drawActionBar.querySelectorAll("calcite-action").forEach((action) => {
      action.disabled = true;
    });
    createAttributes(options.action, event);
  });
  sketchViewModel.on("update", (event) => {
    // Temporarily disable all drawing actions to prevent user interaction during graphic updates.
    drawActionBar.querySelectorAll("calcite-action").forEach((action) => {
      action.disabled = true;
    });
    attributePanel.hidden = false;
    updateAttributes(sketchViewModel, event);
  });
  return sketchViewModel;
}

// Disables update-on-click for all SketchViewModels, preventing users from
// selecting and editing existing graphics.
function disableUpdates() {
  pointSketchViewModel.updateOnGraphicClick = false;
  polylineSketchViewModel.updateOnGraphicClick = false;
  polygonSketchViewModel.updateOnGraphicClick = false;
  textSketchViewModel.updateOnGraphicClick = false;
}

// Prepares the UI and state for drawing a new map note, resetting actions,
// disabling updates, incrementing the note number, and setting a default title.
function initializeNewMapNote() {
  // Clear all active drawing states and indicators to prepare for a new map note.
  resetActions();

  // Prevent editing of existing graphics while starting a new drawing.
  disableUpdates();

  // Advance the map note counter to ensure each new note has a unique default title.
  state.currentMapNoteNumber++;

  // Assign a unique, descriptive default title to the new map note graphic
  // using the updated note number.
  attributeTitleInput.value = `Map Note ${state.currentMapNoteNumber}`;
}

// Resets all drawing action indicators and cancels any active drawing
// or editing sessions for map notes.
function resetActions() {
  // Visually reset all drawing tool indicators in the UI so none appear active.
  drawActionBar.querySelectorAll("calcite-action").forEach((action) => {
    action.indicator = false;
  });

  // Abort any ongoing drawing or editing operations for all map note types to ensure a clean state.
  pointSketchViewModel.cancel();
  polylineSketchViewModel.cancel();
  polygonSketchViewModel.cancel();
  textSketchViewModel.cancel();
}

// Synchronizes the UI and attributes when editing an existing map note graphic,
// ensuring updates are reflected in both.
function updateAttributes(
  sketchViewModel: SketchViewModel,
  event: UpdateEvent,
) {
  // When the user initiates editing, populate the UI with the
  // current attributes of the selected graphic.
  if (event.state === "start") {
    attributeTitleInput.value = event.graphics[0].attributes?.title || "";

    // Track which SketchViewModel is currently being edited to enable correct UI and
    // state management during the update process.
    state.activeSketchViewModel = sketchViewModel;

    // When editing is finished, save changes to the graphic and reset the UI to its default state.
  } else if (event.state === "complete") {
    // Save the updated title from the input field back to the graphic's attributes,
    // ensuring the user's changes are persisted.
    event.graphics[0].attributes.title = attributeTitleInput.value || "";

    // If the graphic uses a text symbol, clone it and update its text property to match the new title.
    const symbol = event.graphics[0].symbol?.clone();
    if (symbol && symbol.type === "text") {
      symbol.text = attributeTitleInput.value || "";
      event.graphics[0].symbol = symbol;
    }

    // Remove focus from the input field after editing to signal completion and improve user experience.
    attributeTitleInput.blur();

    // Reset the reference to the active SketchViewModel, marking the end of the current editing session.
    state.activeSketchViewModel = null;

    // Hide the attribute editing panel to return the UI to its default state after a graphic update.
    attributePanel.hidden = true;

    // Re-enable all drawing and editing actions so the user can continue
    // interacting with map notes after an update.
    drawActionBar.querySelectorAll("calcite-action").forEach((action) => {
      action.disabled = false;
    });
  }
}
