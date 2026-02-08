<script lang="ts">
  import Modal from "bootstrap/js/dist/modal";
  import { rfidInfo, rfidProfiles, labelPropsToApply } from "$/stores";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import { onMount, tick } from "svelte";

  let modalElement = $state<HTMLDivElement | undefined>(undefined);
  let modal: Modal | undefined;
  let lastPromptedRfidId = $state<string>("");
  let pendingProfile = $state<{ rfidId: string; labelProps: import("$/types").LabelProps } | null>(null);

  const paperRfidId = $derived((() => {
    const r = $rfidInfo;
    if (!r?.tagPresent) return "";
    return (r.serialNumber || r.uuid || r.barCode || "").trim();
  })());

  $effect(() => {
    const id = paperRfidId;
    if (!id) {
      lastPromptedRfidId = "";
      pendingProfile = null;
      return;
    }

    const profile = $rfidProfiles.find((p) => p.rfidId === id);
    if (!profile) return;

    if (lastPromptedRfidId === id) return;

    lastPromptedRfidId = id;
    pendingProfile = { rfidId: id, labelProps: profile.labelProps };

    tick().then(() => {
      if (modalElement) {
        if (!modal) modal = new Modal(modalElement);
        modal.show();
      }
    });
  });

  const onApply = () => {
    if (pendingProfile) {
      labelPropsToApply.set(pendingProfile.labelProps);
      pendingProfile = null;
    }
    modal?.hide();
  };

  const onDismiss = () => {
    pendingProfile = null;
    modal?.hide();
  };

  onMount(() => {
    return () => {
      modal?.dispose();
    };
  });
</script>

<div
  bind:this={modalElement}
  class="modal fade"
    tabindex="-1"
    aria-labelledby="rfidProfileApplyLabel"
    aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="rfidProfileApplyLabel">
            <MdIcon icon="nfc" />
            {$tr("params.rfid_profiles.apply.title")}
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          {#if pendingProfile}
            <p>{$tr("params.rfid_profiles.apply.message")}</p>
            <p class="mb-0">
              <strong>RFID:</strong> {pendingProfile.rfidId}<br />
              <strong>{$tr("params.label.size")}:</strong> {pendingProfile.labelProps.size.width}×{pendingProfile.labelProps.size.height} px
            </p>
          {/if}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" onclick={onDismiss}>
            {$tr("params.rfid_profiles.apply.no")}
          </button>
          <button type="button" class="btn btn-primary" onclick={onApply}>
            {$tr("params.rfid_profiles.apply.yes")}
          </button>
        </div>
      </div>
    </div>
  </div>
