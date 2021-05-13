## Quar
A simple Angular QR Code scanner that just works.

#### How to use?
1. Install the package  
    `npm i @altack/quar`  
    
     It will automatically add [jsQR](https://github.com/cozmo/jsQR) as a dependency.  
     *jsQR* is used to decode the video stream captured by the user's camera until a match is found.

2. Import the `QuarModule` in your `AppModule` (or any other module).

3. Attach the `<quar-scanner (scanSuccess)="onSuccess($event)" (scanError)="onError($event)"></quar-scanner>` component to your desired component template.

#### Side notes
- Most common use case is to attach the `<quar-scanner></quar-scanner>` into a fullscreen *MatDialog* component so that the scanner nicely appears on top of everything.
- There's also a helper service `QuarService` it contains some functions to check for browser compatibility and user permissions.
- `(onSuccess)` event will emit only if *jsQR* found a valid QR Code, then *Quar* will stop looking for matches. You can restart the process by calling `restart()` directly from the *QuarComponent* e.g
 
   `@ViewChild(QuarComponent) private quar: QuarComponent;`

  `restartScanning() {
  this.quar.restart();
  }`

- `(scanError)` will emit in case the browser doesn't support WebRTC APIs, or it lacks of user permissions.
   Values are part of the `QuarErrors` *Enum*, and the possible values are `noPermissions`, `notSupported` or `unknownError`.
