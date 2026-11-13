(ns codepen.theme
  (:require [clojure.string :as str]))

;; Records, protocols, destructuring, threading, and metadata.
(defrecord Theme [name accent tokens])

(defprotocol Renderable
  (render [value prefix]))

(extend-protocol Renderable
  Theme
  (render [{:keys [name accent tokens]} prefix]
    (str prefix name " (" accent "): " (str/join ", " tokens))))

(def default-theme
  (->Theme "CodePen Theme Original"
           "#96b38a"
           [:keyword :string :comment]))

(defn visible-tokens
  [theme]
  (->> (:tokens theme)
       (filter keyword?)
       (map name)
       (into #{})))

(when-let [label (render default-theme "theme: ")]
  (println label (visible-tokens default-theme)))
