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
    <?= $this->Html->css('/bootstrap/css/bootstrap.min.css') ?>
    <?= $this->Html->css('/css/styles.css') ?>
    <?= $this->Html->css('/fontawesome/css/all.css') ?>
    <?= $this->Html->script('/js/vgr-fetcher.js') ?>
    <?= $this->fetch('meta') ?>
    <?= $this->fetch('css') ?>
    <?= $this->fetch('script') ?>
</head>
<body>

    <nav class="navbar navbar-light bg-light">
        <div class="container-fluid">
            <h1 class="navbar-brand mb-0 h1">
                VGR Album Art Fetcher
            </h1>
        </div>
    </nav>
    <main class="main">
        <div class="container">
            <?= $this->Flash->render() ?>
            <?= $this->fetch('content') ?>
        </div>
    </main>
    <footer class="container">
        &copy; <?= date('Y') ?> <a href="https://phantomwatson.com">Phantom Watson</a>
        -
        <a href="https://musicbrainz.org/">
            MusicBrainz.org
        </a>
        -
        <a href="https://coverartarchive.org">
            CoverArtArchive.org
        </a>
    </footer>
</body>
</html>
