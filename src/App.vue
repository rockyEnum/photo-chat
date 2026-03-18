<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { showAuthGuide } from "@/utils/auth";

onLaunch(() => {
  console.log("App Launch");
  // 首次进入引导授权
  setTimeout(() => {
    showAuthGuide();
  }, 500);
});

onShow(() => {
  console.log("App Show");
});

onHide(() => {
  console.log("App Hide");
});
</script>

<style lang="scss">
@import "@/styles/vars.css";
@import "@/styles/index.scss";
</style>
