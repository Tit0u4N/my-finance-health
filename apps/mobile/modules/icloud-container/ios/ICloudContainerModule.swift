// The app's iCloud Drive folder — the ubiquity container's `Documents/`, which iOS syncs on its
// own and shows in Files as "iCloud Drive › my finance health" (NSUbiquitousContainers in
// app.json). Two primitives only; everything else goes through expo-file-system on the plain
// file:// paths this hands out (see apps/mobile/src/platform/iCloudContainer.ts).
//
// Without the iCloud entitlement (no paid Apple Developer team yet — docs/owner-setup.md §2) or
// without a signed-in iCloud account, `documentsDirectory` resolves to nil and the app simply
// offers no iCloud location.

import ExpoModulesCore
import Foundation

internal final class InvalidUriException: GenericException<String> {
  override var reason: String {
    "Not a file URI: \(param)"
  }
}

internal final class DownloadTimeoutException: GenericException<String> {
  override var reason: String {
    "\"\(param)\" is still in iCloud and could not be downloaded — check the connection and retry"
  }
}

/// Seconds to wait for a newer version of a file that is already on the device: short, so an
/// offline phone falls back to its local copy instead of stalling every read.
private let refreshWait: TimeInterval = 2
private let pollInterval: TimeInterval = 0.2

public final class ICloudContainerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ICloudContainer")

    // Async functions run off the main thread, which `url(forUbiquityContainerIdentifier:)` requires.
    AsyncFunction("documentsDirectory") { () throws -> String? in
      let fileManager = FileManager.default
      guard fileManager.ubiquityIdentityToken != nil,
            let container = fileManager.url(forUbiquityContainerIdentifier: nil) else {
        return nil
      }
      let documents = container.appendingPathComponent("Documents", isDirectory: true)
      try fileManager.createDirectory(at: documents, withIntermediateDirectories: true)
      return documents.absoluteString
    }

    AsyncFunction("ensureDownloaded") { (uri: String, timeoutMs: Double) throws in
      guard let url = URL(string: uri), url.isFileURL else {
        throw InvalidUriException(uri)
      }
      try ensureLocal(url, timeout: timeoutMs / 1000)
    }
  }

  /// Returns once `url` holds the latest version iCloud knows of. A plain local file, or nothing at
  /// all, returns immediately. An evicted file (only a `.<name>.icloud` placeholder on disk) is
  /// downloaded, waiting up to `timeout`. A file that is on the device but has a newer version in
  /// iCloud waits at most `refreshWait`, then keeps the local copy.
  private func ensureLocal(_ url: URL, timeout: TimeInterval) throws {
    let fileManager = FileManager.default
    let placeholder = url.deletingLastPathComponent().appendingPathComponent(".\(url.lastPathComponent).icloud")
    let isEvicted = !fileManager.fileExists(atPath: url.path) && fileManager.fileExists(atPath: placeholder.path)
    guard isEvicted || fileManager.isUbiquitousItem(at: url) else {
      return
    }
    if isCurrent(url) {
      return
    }
    try fileManager.startDownloadingUbiquitousItem(at: url)
    let deadline = Date().addingTimeInterval(isEvicted ? timeout : min(timeout, refreshWait))
    while Date() < deadline {
      if isCurrent(url) {
        return
      }
      Thread.sleep(forTimeInterval: pollInterval)
    }
    if !fileManager.fileExists(atPath: url.path) {
      throw DownloadTimeoutException(url.lastPathComponent)
    }
  }

  private func isCurrent(_ url: URL) -> Bool {
    var fresh = url
    fresh.removeAllCachedResourceValues()
    let values = try? fresh.resourceValues(forKeys: [.ubiquitousItemDownloadingStatusKey])
    return values?.ubiquitousItemDownloadingStatus == .current
  }
}
