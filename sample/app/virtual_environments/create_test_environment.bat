:: Prerequisites:
::   Miniconda/Anaconda

:: Set environmental variables
set ENVIRONMENT_NAME=test_environment

:: Remove old conda environment (if it exists) and create a new environment
call conda deactivate
call conda env remove -n %ENVIRONMENT_NAME%
call conda create -n %ENVIRONMENT_NAME% python=3.11 -y

:: Activate conda environment
call conda activate %ENVIRONMENT_NAME%

:: Install dependencies
call pip install flask flask-cors flask-socketio requests termcolor

:: Deactivate conda environment
call conda deactivate

pause
