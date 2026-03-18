import 'uni-app-types';

declare module 'vue' {
  type Hooks = App.AppInstance & Page.PageInstance;

  interface ComponentCustomOptions extends Hooks {
    /**
     * 小程序的自定义组件生命周期
     */
    lifetimes?: any;
    /**
     * 小程序的组件关系
     */
    relations?: any;
  }
}
