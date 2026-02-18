@php
  $hotPath = public_path('hot');
  $manifestPath = public_path('build/manifest.json');

  $useHot = file_exists($hotPath);
  $useManifest = file_exists($manifestPath);

  $manifestCss = [];
  $manifestJs = [];

  if ($useManifest) {
    $manifest = json_decode((string) @file_get_contents($manifestPath), true) ?: [];
    $entries = ['resources/js/app.js', 'resources/css/app.css'];

    foreach ($entries as $entry) {
      if (!isset($manifest[$entry]) || !is_array($manifest[$entry])) continue;
      $data = $manifest[$entry];

      if (!empty($data['file']) && is_string($data['file'])) {
        if (str_ends_with($data['file'], '.js')) $manifestJs[] = $data['file'];
        if (str_ends_with($data['file'], '.css')) $manifestCss[] = $data['file'];
      }

      if (!empty($data['css']) && is_array($data['css'])) {
        foreach ($data['css'] as $cssFile) {
          if (is_string($cssFile)) $manifestCss[] = $cssFile;
        }
      }
    }

    $manifestCss = array_values(array_unique($manifestCss));
    $manifestJs = array_values(array_unique($manifestJs));
  }
@endphp

@if($useHot)
  @php $hot = rtrim(trim((string) @file_get_contents($hotPath)), '/'); @endphp
  @if($hot !== '')
    <script type="module" src="{{ $hot }}/@vite/client"></script>
    <script type="module" src="{{ $hot }}/resources/js/app.js"></script>
  @endif
@elseif($useManifest)
  @foreach($manifestCss as $css)
    <link rel="stylesheet" href="/build/{{ $css }}">
  @endforeach
  @foreach($manifestJs as $js)
    <script type="module" src="/build/{{ $js }}"></script>
  @endforeach
@endif
