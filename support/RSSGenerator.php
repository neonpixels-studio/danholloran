<?php

namespace App\Support;

use Zttp\Zttp;
use Carbon\Carbon;
use Zttp\ZttpResponse;
use TightenCo\Jigsaw\Jigsaw;
use Illuminate\Support\Collection;
use League\HTMLToMarkdown\HtmlConverter;

abstract class RSSGenerator
{
    protected $jigsaw;
    // Requires: Collection Name, Jigsaw,Group

    abstract protected function groups(): Collection;

    abstract protected function formatItem(Collection $item, string $group): Collection;

    abstract protected function collectionName(): string;

    abstract protected function convertResponseToItems(ZttpResponse $response): Collection;

    abstract protected function getServiceUrl(string $group): string;

    abstract protected function getCachePrefix(): string;


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
        $items->each(function ($item) {
            $path = "_{$this->collectionName()}/{$item->get('slug')}.md";
            if (file_exists("{$this->jigsaw->getSourcePath()}/{$path}")) {
                return;
            }

            $this->jigsaw->writeSourceFile(
                $path,
                $this->convertItemToMarkdown($item)
            );
        });
    }

    protected function convertItemToMarkdown(Collection $item): string
    {
        $frontMatter = $item->except(['body'])->map(function ($value, $key) {
            $value = preg_replace('/"/u', '\\\\\"', $value);

            return "{$key}: \"{$value}\"";
        })
            ->prepend('---')
            ->push('---')
            ->implode("\n");
        return collect([
            $frontMatter,
            (new HtmlConverter())->convert($item->get('body', '')),
        ])->implode("\n");
    }

    protected function getItemsFromCache(string $group): Collection
    {
        $this->updateIfNotCached($group);

        try {
            $file = $this->jigsaw->readSourceFile($this->getCachePath($group));
            return collect(json_decode($file, true))->recursive()->get('items', collect());
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
                'items' => $this->getItems($group),
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
        return ".cache/{$this->getCachePrefix()}-{$group}.json";
    }

    protected function formatItems(Collection $items, string $group): Collection
    {
        return $items->map(function ($item) use ($group) {
            return $this->formatItem($item, $group);
        });
    }
}
