import 'package:flutter/material.dart';

class ActorScreen extends StatelessWidget {
  const ActorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final actorName = ModalRoute.of(context)?.settings.arguments as String? ?? 'Actor';
    return Scaffold(
      appBar: AppBar(title: Text(actorName)),
      body: const Center(
        child: Text('Actor filmography coming soon', style: TextStyle(color: Colors.white54)),
      ),
    );
  }
}

class ArticleDetailScreen extends StatelessWidget {
  const ArticleDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final articleId = ModalRoute.of(context)?.settings.arguments as String? ?? '';
    return Scaffold(
      appBar: AppBar(title: const Text('Article')),
      body: Center(
        child: Text('Article $articleId', style: const TextStyle(color: Colors.white54)),
      ),
    );
  }
}

class ListDetailScreen extends StatelessWidget {
  const ListDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final listId = ModalRoute.of(context)?.settings.arguments as String? ?? '';
    return Scaffold(
      appBar: AppBar(title: const Text('Movie List')),
      body: Center(
        child: Text('List $listId', style: const TextStyle(color: Colors.white54)),
      ),
    );
  }
}
