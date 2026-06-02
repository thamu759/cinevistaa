import 'package:flutter/material.dart';
import 'dart:math';
import '../../theme/app_colors.dart';

class QuizScreen extends StatefulWidget {
  const QuizScreen({super.key});

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  int _score = 0;
  int _currentQuestion = 0;
  bool _showResult = false;
  final _rand = Random();

  final _questions = [
    {'q': 'Who directed "Interstellar"?', 'a': 'Christopher Nolan', 'options': ['Christopher Nolan', 'Denis Villeneuve', 'Steven Spielberg', 'James Cameron']},
    {'q': 'Which movie won Best Picture in 2024?', 'a': 'Oppenheimer', 'options': ['Barbie', 'Oppenheimer', 'Killers of the Flower Moon', 'Poor Things']},
    {'q': 'What is the highest-grossing film of all time?', 'a': 'Avatar', 'options': ['Avengers: Endgame', 'Avatar', 'Titanic', 'Star Wars: TFA']},
    {'q': 'Who played the Joker in "The Dark Knight"?', 'a': 'Heath Ledger', 'options': ['Joaquin Phoenix', 'Heath Ledger', 'Jack Nicholson', 'Jared Leto']},
    {'q': 'Which film won the Palme d\'Or at Cannes 2023?', 'a': 'Anatomy of a Fall', 'options': ['Oppenheimer', 'Anatomy of a Fall', 'Killers of the Flower Moon', 'The Zone of Interest']},
  ];

  void _answer(String selected) {
    if (_questions[_currentQuestion]['a'] == selected) {
      _score++;
    }
    if (_currentQuestion < _questions.length - 1) {
      setState(() => _currentQuestion++);
    } else {
      setState(() => _showResult = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_showResult) {
      return Scaffold(
        appBar: AppBar(title: const Text('Quiz Result')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Your Score: $_score/${_questions.length}',
                  style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.textMain)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => setState(() {
                  _score = 0;
                  _currentQuestion = 0;
                  _showResult = false;
                }),
                child: const Text('Play Again'),
              ),
            ],
          ),
        ),
      );
    }

    final q = _questions[_currentQuestion];
    final shuffled = List<String>.from(q['options'] as List)..shuffle(_rand);

    return Scaffold(
      appBar: AppBar(title: Text('Question ${_currentQuestion + 1}/${_questions.length}')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text('Score: $_score', style: const TextStyle(color: AppColors.accentGold, fontSize: 18)),
            const SizedBox(height: 32),
            Text(q['q'] as String, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textMain, height: 1.3)),
            const SizedBox(height: 32),
            ...shuffled.map((option) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => _answer(option),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.textMain,
                    side: const BorderSide(color: Colors.white24),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text(option, style: const TextStyle(fontSize: 16)),
                ),
              ),
            )),
          ],
        ),
      ),
    );
  }
}
