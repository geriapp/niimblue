<script lang="ts">
  import { Utils } from "@mmote/niimbluelib";
  import { onMount } from "svelte";
  import BrowserWarning from "$/components/basic/BrowserWarning.svelte";
  import LabelDesigner from "$/components/LabelDesigner.svelte";
  import PrinterConnector from "$/components/PrinterConnector.svelte";
  import PrinterStatusBar from "$/components/basic/PrinterStatusBar.svelte";
  import RfidProfileApplyPrompt from "$/components/basic/RfidProfileApplyPrompt.svelte";
  import { loadProfilesFromFile } from "$/stores";
  import { locale, locales, tr } from "$/utils/i18n";

  // eslint-disable-next-line no-undef
  const appCommit = __APP_COMMIT__;
  // eslint-disable-next-line no-undef
  const buildDate = __BUILD_DATE__;

  let isStandalone = Utils.getAvailableTransports().capacitorBle;

  onMount(() => {
    loadProfilesFromFile();
  });
</script>

<div class="main-app">
  <header class="app-header">
    <div class="container">
      <div class="row align-items-center py-2">
        <div class="col">
          <div class="d-flex align-items-center gap-3 flex-wrap">
            <h1 class="app-title mb-0">
              <span class="niim">Niim</span><span class="blue">Blue{isStandalone ? "s" : ""}</span>
            </h1>
            <PrinterStatusBar />
          </div>
        </div>
        <div class="col-auto">
          <PrinterConnector />
        </div>
      </div>
    </div>
  </header>

  <main class="app-main">
    <div class="container py-3">
      <BrowserWarning />

      <div class="editor-section">
        <LabelDesigner />
      </div>
      <RfidProfileApplyPrompt />
    </div>
  </main>
</div>

<div class="footer text-end text-secondary p-3">
  <div>
    <select class="form-select form-select-sm text-secondary d-inline-block w-auto" bind:value={$locale}>
      {#each Object.entries(locales) as [key, name] (key)}
        <option value={key}>{name}</option>
      {/each}
    </select>
  </div>
  <div>
    {#if appCommit}
      <a class="text-secondary" href="https://github.com/MultiMote/niimblue/commit/{appCommit}">
        {appCommit.slice(0, 6)}
      </a>
    {/if}
    {$tr("main.built")}
    {buildDate}
  </div>
  <div>
    <a class="text-secondary" href="https://github.com/MultiMote/niimblue">{$tr("main.code")}</a>
  </div>
</div>

<style>
  .main-app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    background: linear-gradient(135deg, rgba(11, 126, 255, 0.08) 0%, rgba(255, 83, 73, 0.06) 100%);
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .app-title {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }

  .niim {
    color: #ff5349;
  }

  .blue {
    color: #0b7eff;
  }

  .app-main {
    flex: 1;
  }

  .editor-section {
    background: var(--bs-body-bg);
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  .footer {
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: -1;
  }

  @media only screen and (max-device-width: 540px) {
    .footer {
      position: relative !important;
      z-index: 0 !important;
    }
  }
</style>
