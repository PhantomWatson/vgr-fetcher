<?php
/**
 * @var \App\View\AppView $this
 * @var string $title
 */
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>
        <?= $title ?>
    </title>
    <?= $this->Html->meta('icon') ?>
    <link href="/bootstrap/css/bootstrap.min.css" rel="stylesheet" />
    <link href="/css/styles.css" rel="stylesheet" />
    <link href="/fontawesome/css/all.css" rel="stylesheet">
    <?php /* echo $this->Html->css(['normalize.min', 'milligram.min', 'cake']);*/ ?>
    <script src="/js/vgr-fetcher.js"></script>
    <?= $this->fetch('meta') ?>
    <?= $this->fetch('css') ?>
    <?= $this->fetch('script') ?>
</head>
<body>
    <h1>
        VGR Album Art Fetcher
    </h1>
    <main class="main">
        <div class="container">
            <?= $this->Flash->render() ?>
            <?= $this->fetch('content') ?>
        </div>
    </main>
    <footer>
        <ul>
            <li>
                &copy; <?= date('Y') ?> <a href="https://phantomwatson.com">Phantom Watson</a>
            </li>
            <li>
                <a href="https://musicbrainz.org/">
                    MusicBrainz.org
                </a>
            </li>
            <li>
                <a href="https://coverartarchive.org">
                    CoverArtArchive.org
                </a>
            </li>
        </ul>
    </footer>
</body>
</html>
