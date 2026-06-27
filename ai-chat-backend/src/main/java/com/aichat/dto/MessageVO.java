package com.aichat.dto;

import com.aichat.entity.File;
import com.aichat.entity.Message;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MessageVO extends Message {
    private String dateLabel;
    private List<File> files;
}
