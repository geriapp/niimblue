<script lang="ts">
  import Modal from "bootstrap/js/dist/modal";
  import {
    heartbeatData,
    printerInfo,
    printerMeta,
    rfidInfo,
  } from "$/stores";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import type { MaterialIcon } from "material-icons";
  import { onMount } from "svelte";

  const chargeToPercent = (level: number): number => {
    const map: Record<number, number> = { 0: 0, 1: 25, 2: 50, 3: 75, 4: 100 };
    return map[level] ?? 0;
  };

  const batteryIcon = (level: number): MaterialIcon => {
    if (level >= 4) return "battery_full";
    if (level >= 3) return "battery_5_bar";
    if (level >= 2) return "battery_3_bar";
    if (level >= 1) return "battery_2_bar";
    return "battery_0_bar";
  };

  /** Convert Fahrenheit (from printer) to Celsius for display */
  const fahrenheitToCelsius = (f: number): number => Math.round(((f - 32) * 5) / 9);

  const firmwareVersion = $derived.by(() => {
    const v = $printerInfo?.softwareVersion;
    if (!v) return "";
    if (v.includes("(")) {
      const match = v.match(/\(([^)]+)\)/);
      return match ? `v${match[1].split(" ")[0] ?? v}` : v;
    }
    return `v${v}`;
  });

  const paperRfidId = $derived.by(() => {
    const r = $rfidInfo;
    if (!r?.tagPresent) return "";
    return (r.serialNumber || r.uuid || r.barCode || "").trim();
  });

  let lidModalElement = $state<HTMLDivElement | undefined>(undefined);
  let lidModal = $state<Modal | undefined>(undefined);
  let lidPopupDismissed = $state(false);

  $effect(() => {
    const lidOpen = $heartbeatData && !$heartbeatData.lidClosed;
    const el = lidModalElement;
    if (!el) return;

    if (lidOpen) {
      if (!lidModal) {
        lidModal = new Modal(el);
        el.addEventListener("hidden.bs.modal", () => {
          lidPopupDismissed = true;
        });
      }
      if (!lidPopupDismissed) {
        lidModal.show();
      }
    } else {
      lidModal?.hide();
      lidPopupDismissed = false;
    }
  });

  onMount(() => {
    return () => {
      lidModal?.dispose();
    };
  });
</script>

{#if $printerMeta}
  <div class="printer-status-bar">
    {#if $heartbeatData?.chargeLevel !== undefined}
      <span class="status-item status-item-display" title={$tr("status.icon.battery")}>
        <MdIcon icon={batteryIcon($heartbeatData.chargeLevel)} class="r-90" />
        <span class="status-label">{$tr("status.icon.battery")}</span>
        <span class="status-value">{chargeToPercent($heartbeatData.chargeLevel)}%</span>
      </span>
    {/if}

    {#if $printerInfo?.softwareVersion}
      <span class="status-item status-item-display" title={$printerInfo.softwareVersion}>
        <MdIcon icon="terminal" />
        <span class="status-label">{$tr("status.icon.firmware")}</span>
        <span class="status-value">{firmwareVersion}</span>
      </span>
    {/if}

    {#if $heartbeatData}
      <span
        class="status-item status-item-display"
        class:status-ok={$heartbeatData.lidClosed}
        class:status-danger={!$heartbeatData.lidClosed}
        title="{$heartbeatData.lidClosed ? $tr('status.icon.lid') + ': OK' : $tr('status.icon.lid') + ': Open'}">
        <MdIcon icon={$heartbeatData.lidClosed ? "lock" : "lock_open"} />
        <span class="status-label">{$tr("status.icon.lid")}</span>
      </span>
      <span
        class="status-item status-item-display"
        class:status-ok={$heartbeatData.paperInserted}
        class:status-warn={!$heartbeatData.paperInserted}
        title="{$heartbeatData.paperInserted ? $tr('status.icon.paper_insert') + ': OK' : $tr('status.icon.paper_insert') + ': Not inserted'}">
        <MdIcon icon="feed" />
        <span class="status-label">{$tr("status.icon.paper_insert")}</span>
      </span>
      <span
        class="status-item status-item-display"
        class:status-ok={$heartbeatData.paperRfidSuccess}
        class:status-warn={!$heartbeatData.paperRfidSuccess}
        title="{($heartbeatData.paperRfidSuccess ? $tr('status.icon.paper_rfid') + ': OK' : $tr('status.icon.paper_rfid') + ': Fail')}{paperRfidId ? ' · ' + paperRfidId : ''}">
        <MdIcon icon="nfc" />
        <span class="status-label">{$tr("status.icon.paper_rfid")}</span>
        {#if paperRfidId}
          <span class="status-value status-value-paper">{paperRfidId}</span>
        {/if}
      </span>
      {#if $heartbeatData.temp !== undefined}
        <span class="status-item status-item-display" title={$tr("status.icon.temp")}>
          <MdIcon icon="thermostat" />
          <span class="status-label">{$tr("status.icon.temp")}</span>
          <span class="status-value">{fahrenheitToCelsius($heartbeatData.temp)}°C</span>
        </span>
      {/if}
    {/if}
  </div>

  {#if $heartbeatData}
    <div
      bind:this={lidModalElement}
      class="modal fade"
      tabindex="-1"
      aria-labelledby="lidOpenModalLabel"
      aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-danger">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title" id="lidOpenModalLabel">
              <MdIcon icon="warning" />
              {$tr("status.lid.open.title")}
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            {$tr("status.lid.open.message")}
          </div>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .printer-status-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    padding: 0.25rem 0;
  }

  .status-item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    padding: 0.35rem 0.5rem;
    min-width: 2.5rem;
  }

  .status-item-display {
    background: transparent;
    border: none;
    cursor: default;
  }

  .status-item-display:hover {
    background: transparent;
    border-color: transparent;
  }

  .status-item :global(.mdi) {
    font-size: 1.1rem;
  }

  .status-label {
    font-size: 0.65rem;
    line-height: 1;
    color: var(--bs-secondary-color);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .status-value {
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1;
    color: var(--bs-body-color);
  }

  .status-value-paper {
    font-size: 0.7rem;
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
  }

  .status-ok :global(.mdi) {
    color: var(--bs-success) !important;
  }

  .status-warn :global(.mdi) {
    color: var(--bs-warning) !important;
  }

  .status-danger :global(.mdi) {
    color: var(--bs-danger) !important;
  }
</style>
