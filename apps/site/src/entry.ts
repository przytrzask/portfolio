import { Runtime } from "foldkit";

import { init, Message, Model, update, view } from "./main.ts";
import { boot } from "./rider/boot.ts";

import "./styles.css";

const application = Runtime.makeApplication({
  container: document.getElementById("root"),
  devTools: import.meta.env.DEV ? { Message } : false,
  init,
  Model,
  routing: {
    onUrlChange: (url) => Message.ChangedUrl({ url }),
    onUrlRequest: (request) => Message.ClickedLink({ request }),
  },
  update,
  view,
});

Runtime.hydrate(application);

boot(
  (query) => window.matchMedia(query),
  () =>
    import("./rider/ski-rider.ts").then(
      (rider) => rider.register(),
      () => undefined
    )
);
