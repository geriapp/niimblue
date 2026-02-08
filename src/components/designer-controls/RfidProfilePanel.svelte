<script lang="ts">
  import { rfidInfo, rfidProfiles, labelPresets, currentLabelProps, saveProfilesToApi } from "$/stores";
  import { FileUtils } from "$/utils/file_utils";
  import { Toasts } from "$/utils/toasts";
  import { tr } from "$/utils/i18n";
  import MdIcon from "$/components/basic/MdIcon.svelte";
  import type { RfidLabelProfile } from "$/types";
  import { ProfilesFileSchema } from "$/types";

  const paperRfidId = $derived((() => {
    const r = $rfidInfo;
    if (!r?.tagPresent) return "";
    return (r.serialNumber || r.uuid || r.barCode || "").trim();
  })());

  const onSaveCurrent = () => {
    if (!paperRfidId) return;
    const labelProps = $currentLabelProps;
    const existing = $rfidProfiles.findIndex((p) => p.rfidId === paperRfidId);
    const profile: RfidLabelProfile = {
      rfidId: paperRfidId,
      labelProps,
      title: `${labelProps.size.width}×${labelProps.size.height}px`,
    };
    let next = [...$rfidProfiles];
    if (existing >= 0) {
      next[existing] = profile;
    } else {
      next.push(profile);
    }
    rfidProfiles.set(next);
    saveProfilesToApi({ rfidProfiles: next, labelPresets: $labelPresets });
  };

  const onDelete = (rfidId: string) => {
    const next = $rfidProfiles.filter((p) => p.rfidId !== rfidId);
    rfidProfiles.set(next);
    saveProfilesToApi({ rfidProfiles: next, labelPresets: $labelPresets });
  };

  const onImportJson = async () => {
    try {
      const contents = await FileUtils.pickAndReadSingleTextFile("json");
      const rawData = JSON.parse(contents);

      if (!confirm($tr("params.rfid_profiles.import_confirm"))) {
        return;
      }

      const parsed = ProfilesFileSchema.parse(rawData);
      rfidProfiles.set(parsed.rfidProfiles);
      labelPresets.set(parsed.labelPresets);
      saveProfilesToApi(parsed);
      Toasts.message($tr("params.rfid_profiles.imported"));
    } catch (e) {
      Toasts.zodErrors(e, "Profiles load error:");
    }
  };

  const onExportJson = () => {
    try {
      FileUtils.saveProfilesAsJson({
        rfidProfiles: $rfidProfiles,
        labelPresets: $labelPresets,
      });
      Toasts.message($tr("params.rfid_profiles.exported"));
    } catch (e) {
      Toasts.zodErrors(e, "Profiles save error:");
    }
  };
</script>

<div class="p-2 small">
  <div class="d-flex gap-1 mb-2">
    <button class="btn btn-sm btn-outline-secondary" onclick={onImportJson}>
      <MdIcon icon="upload_file" />
      {$tr("params.label.import")}
    </button>
    <button class="btn btn-sm btn-outline-secondary" onclick={onExportJson}>
      <MdIcon icon="download" />
      {$tr("params.label.export")}
    </button>
  </div>

  {#if paperRfidId}
    <div class="mb-2">
      <div class="text-secondary mb-1">{$tr("params.rfid_profiles.current_rfid")}: {paperRfidId}</div>
      <button class="btn btn-sm btn-primary" onclick={onSaveCurrent}>
        <MdIcon icon="save" />
        {$tr("params.rfid_profiles.save_current")}
      </button>
    </div>
  {:else}
    <div class="text-secondary mb-2">{$tr("params.rfid_profiles.no_paper")}</div>
  {/if}

  {#if $rfidProfiles.length > 0}
    <div class="mt-2">
      <div class="text-secondary mb-1">{$tr("params.rfid_profiles.saved")}:</div>
      <ul class="list-unstyled mb-0">
        {#each $rfidProfiles as profile (profile.rfidId)}
          <li class="d-flex align-items-center gap-1 mb-1">
            <span class="flex-grow-1 text-truncate" title={profile.rfidId}>
              {profile.rfidId}: {profile.labelProps.size.width}×{profile.labelProps.size.height}px
            </span>
            <button
              class="btn btn-sm btn-outline-danger py-0 px-1"
              type="button"
              onclick={() => onDelete(profile.rfidId)}
              aria-label="Delete">
              <MdIcon icon="delete" />
            </button>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
