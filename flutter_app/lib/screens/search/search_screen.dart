import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/movie_provider.dart';
import '../home/widgets/movie_card.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  List _allMovies = [];
  List _filteredMovies = [];
  bool _isSearching = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final movies = context.read<MovieProvider>().movies;
      setState(() {
        _allMovies = movies;
        _filteredMovies = movies;
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    setState(() {
      _isSearching = true;
      if (query.isEmpty) {
        _filteredMovies = _allMovies;
      } else {
        _filteredMovies = _allMovies.where((m) =>
          m.title.toLowerCase().contains(query.toLowerCase()) ||
          m.genre.toLowerCase().contains(query.toLowerCase())
        ).toList();
      }
      _isSearching = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          autofocus: true,
          onChanged: _onSearchChanged,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'Search movies, genres...',
            hintStyle: TextStyle(color: Colors.grey[600]),
            border: InputBorder.none,
            filled: false,
          ),
        ),
        actions: [
          if (_searchController.text.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.clear, color: Colors.white54),
              onPressed: () {
                _searchController.clear();
                _onSearchChanged('');
              },
            ),
        ],
      ),
      body: _isSearching
          ? const Center(child: CircularProgressIndicator())
          : _filteredMovies.isEmpty
              ? const Center(child: Text('No movies found', style: TextStyle(color: Colors.white54)))
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.7,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: _filteredMovies.length,
                  itemBuilder: (context, index) => MovieCard(
                    movie: _filteredMovies[index],
                    onTap: () {
                      Navigator.pushNamed(context, '/movie-details',
                          arguments: _filteredMovies[index].id);
                    },
                  ),
                ),
    );
  }
}
