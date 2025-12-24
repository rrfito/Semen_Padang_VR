$disk = Illuminate\Support\Facades\Storage::disk('public');
$files = $disk->allFiles('panoramas');
echo "TotalFiles: " . count($files) . PHP_EOL;
echo "LiveScenes: " . App\Models\Scene::count() . PHP_EOL;
echo "DraftScenes: " . App\Models\Drafts\SceneDraft::count() . PHP_EOL;
