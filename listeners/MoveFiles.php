<?php

namespace App\Listeners;

use TightenCo\Jigsaw\Jigsaw;

class MoveFiles
{
    public function handle(Jigsaw $jigsaw)
    {
        // _redirects
        copy("{$jigsaw->getDestinationPath()}/../_redirects", "{$jigsaw->getDestinationPath()}/_redirects");
    }
}
