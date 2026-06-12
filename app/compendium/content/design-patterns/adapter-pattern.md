---
title: "Adapter Pattern"
collection: "design-patterns"
sourcePath: "Knowledge base/Design Patterns/Adapter Pattern.md"
order: 1
---
**Adapter** allows classes with incompatible interfaces to work together by converting the interface of one class into an interface expected by the client. It acts as a wrapper that sits between two unrelated components, translating calls so that they can collaborate.

* **Intent:** *“Adapter is a structural design pattern that allows objects with incompatible interfaces to collaborate.”* In other words, it **converts** the interface of one class into another interface that the client expects.
* **Use Cases:** Integration of legacy code with new code (e.g., wrapping an old API so a new system can use it), using a class that doesn’t match a required interface, or adapting one library’s interface to another’s. For example, if your code expects a `ILogger` interface but you want to use a third-party logging class `ExternalLogger` with a different method, you can write an Adapter that implements `ILogger` and delegates to `ExternalLogger` internally.

**Example:** Adapting a third-party audio player to your application’s media player interface:

```typescript
// Existing interface in our system:
interface MediaPlayer {
  play(fileName: string): void;
}

// A third-party class with a different interface:
class ThirdPartyAudioPlayer {
  playFile(file: string, codec: string): void {
    console.log(`Playing ${file} with codec ${codec}`);
  }
}

// Adapter class to make ThirdPartyAudioPlayer conform to MediaPlayer:
class AudioPlayerAdapter implements MediaPlayer {
  private adaptee: ThirdPartyAudioPlayer;
  constructor(adaptee: ThirdPartyAudioPlayer) {
    this.adaptee = adaptee;
  }
  play(fileName: string): void {
    // The adapter translates the simple play() call into the expected format:
    const codec = fileName.endsWith(".mp3") ? "MP3" : "default";
    this.adaptee.playFile(fileName, codec);
  }
}

// Client code uses MediaPlayer interface:
const player: MediaPlayer = new AudioPlayerAdapter(new ThirdPartyAudioPlayer());
player.play("song.mp3");  // The ThirdPartyAudioPlayer is used under the hood
```

Here, `AudioPlayerAdapter` implements the `MediaPlayer` interface expected by our app, but internally it holds a `ThirdPartyAudioPlayer` and calls its `playFile` method with appropriate parameters. The client code doesn’t need to know about the third-party specifics – it just uses the standard interface. The Adapter pattern promotes **reusability** by allowing existing incompatible classes to work with new systems without modifying their source.
