<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$baseDir = __DIR__ . DIRECTORY_SEPARATOR . 'projects';
$result = [];
if (!is_dir($baseDir)) {
    echo json_encode(['success' => true, 'projects' => []]);
    exit;
}

$dirs = scandir($baseDir);
foreach ($dirs as $d) {
    if ($d === '.' || $d === '..') continue;
    $full = $baseDir . DIRECTORY_SEPARATOR . $d;
    if (!is_dir($full)) continue;

    $metaPath = $full . DIRECTORY_SEPARATOR . 'meta.json';
    $proj = ['id' => $d, 'folder' => 'projects/' . $d, 'name' => $d, 'created_at' => null, 'index' => 'projects/' . $d . '/index.html'];
    if (file_exists($metaPath)) {
        $meta = json_decode(file_get_contents($metaPath), true);
        if (is_array($meta)) {
            $proj['name'] = isset($meta['project_name']) ? $meta['project_name'] : $proj['name'];
            $proj['created_at'] = isset($meta['created_at']) ? $meta['created_at'] : $proj['created_at'];
            $proj['index'] = isset($meta['index']) ? $meta['index'] : $proj['index'];
        }
    }
    $result[] = $proj;
}

// sort by created_at desc if available
usort($result, function($a,$b){
    $ta = isset($a['created_at']) ? strtotime($a['created_at']) : 0;
    $tb = isset($b['created_at']) ? strtotime($b['created_at']) : 0;
    return $tb - $ta;
});

echo json_encode(['success' => true, 'projects' => $result]);
exit;
