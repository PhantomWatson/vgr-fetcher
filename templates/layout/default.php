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
            <p class="alert alert-primary">
                Enter album information into the text field to process it and find its cover art, provided by the
                <a href="https://musicbrainz.org/">MusicBrains</a> and
                <a href="https://coverartarchive.org">Cover Art Archive</a>. This was created to help out
                <a href="https://www.facebook.com/VillageGreenRecords/">Village Green Records</a>.
            </p>

            <?= $this->Flash->render() ?>
            <?= $this->fetch('content') ?>
        </div>
    </main>
    <footer class="container">
        &copy; <?= date('Y') ?> <a href="https://phantomwatson.com">Phantom Watson</a>
        -
        <a href="https://github.com/PhantomWatson/vgr-fetcher">GitHub</a>
    </footer>
</body>
</html>
