<?php

namespace App\Support;

use Zttp\Zttp;
use Carbon\Carbon;
use Zttp\ZttpResponse;
use Illuminate\Support\Str;
use TightenCo\Jigsaw\Jigsaw;
use Illuminate\Support\Collection;
use League\HTMLToMarkdown\HtmlConverter;

abstract class RSSGenerator
{
    protected $jigsaw;
    // Requires: Collection Name, Jigsaw,Group

    abstract protected function groups(): Collection;

    abstract protected function formatItem(Collection $item, string $group): RSSItem;

    abstract protected function collectionName(): string;

    abstract protected function getServiceUrl(string $group): string;

    protected function setJigsaw(Jigsaw $jigsaw): RSSGenerator
    {
        $this->jigsaw = $jigsaw;
        return $this;
    }

    public function handle(Jigsaw $jigsaw)
    {
        $this->setJigsaw($jigsaw);
        $this->groups()->each(function ($group) {
            $items = $this->getItemsFromCache($group);
            $this->generateMarkdownForItems($items);
        });
    }

    protected function generateMarkdownForItems(Collection $items): void
    {
        $items->each(function (RSSItem $item) {
            $filename = substr($item->slug(), 0, 200);
            $path = "_{$this->collectionName()}/{$filename}.md";
            if (file_exists("{$this->jigsaw->getSourcePath()}/{$path}")) {
                return;
            }

            $this->jigsaw->writeSourceFile(
                $path,
                trim($this->removeAdds($this->convertItemToMarkdown($item)))
            );
        });
    }

    protected function removeAdds(string $content)
    {
        return str_replace([
            '<span style="font-size:12px; color: gray;">(Feed generated with [FetchRSS](http://fetchrss.com))</span>',
        ], '', $content);
    }

    protected function convertItemToMarkdown(RSSItem $item): string
    {
        $frontmatter = $item->frontmatter()->map(function ($value, $key) {
            $value = preg_replace('/"/u', '\\\\\"', $value);

            return "{$key}: \"{$value}\"";
        })
            ->prepend('---')
            ->push('---')
            ->implode("\n");
        return collect([
            $frontmatter,
            (new HtmlConverter())->convert($item->body()),
        ])->implode("\n");
    }

    protected function getItemsFromCache(string $group): Collection
    {
        $this->updateIfNotCached($group);

        try {
            $file = $this->jigsaw->readSourceFile($this->getCachePath($group));
            return collect(json_decode($file, true))->recursive()
                ->get('items', collect())
                ->map(function ($item) {
                    $frontmatter = $item->get('frontmatter', collect());
                    return new RSSItem(
                        $frontmatter->get('title'),
                        $item->get('body'),
                        $frontmatter->toArray()
                    );
                });
        } catch (\Exception $e) {
            return collect();
        }
    }

    protected function updateIfNotCached(string $group): void
    {
        if (!$this->shouldUpdate($group)) {
            return;
        }

        try {
            $this->jigsaw->writeSourceFile($this->getCachePath($group), collect([
                'items' => $this->getItems($group)->map->toArray(),
                'lastUpdatedAt' => Carbon::now(),
                ]));
        } catch (\Exception $e) {
            return;
        }
    }

    protected function getItems(string $group): Collection
    {
        $response = Zttp::get($this->getServiceUrl($group));

        if (!$response->isOk()) {
            return collect([]);
        }

        $items = $this->convertResponseToItems($response)->recursive();

        return $this->formatItems($items, $group);
    }

    protected function shouldUpdate(string $group): bool
    {
        $lastUpdatedAt = $this->readSourceFile($group)->get('lastUpdatedAt');
        if (!$lastUpdatedAt) {
            return true;
        }

        return (Carbon::now())->subDay()->gte(new Carbon($lastUpdatedAt));
    }

    protected function readSourceFile(string $group): Collection
    {
        try {
            $file = $this->jigsaw->readSourceFile($this->getCachePath($group));
            return collect(json_decode($file, true))->recursive();
        } catch (\Exception $e) {
            return collect();
        }
    }

    protected function getCachePath(string $group): string
    {
        return ".cache/{$this->collectionName()}-{$group}.json";
    }

    protected function formatItems(Collection $items, string $group): Collection
    {
        return $items->map(function ($item) use ($group) {
            return $this->formatItem($item, $group);
        });
    }

    protected function isMultiLevel($item)
    {
        return $item->keys()->reject(function ($key) {
            return is_numeric($key);
        })->isEmpty();
    }

    protected function convertResponseToItems(ZttpResponse $response): Collection
    {
        $xml = $response->body();
        $xml = simplexml_load_string($xml, \SimpleXMLElement::class, LIBXML_NOCDATA)->children()->children();
        $xml = json_decode(json_encode($xml), true);

        $item = collect($xml)->recursive()->get('item', collect([]));
        if ($this->isMultiLevel($item)) {
            return $item;
        }

        return collect([$item])->recursive();
    }
}
